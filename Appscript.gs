// ─── CONFIGURATION ────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://sbbduepzfhuysshedjhu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eAbWaf3o6qxPDpWKUQWhOw_qS8EJW7C';
const GEMINI_API_KEY = 'AIzaSyDgPQZFF-9bp61wP8sCaIF1hi7MuftYXk4';

const BATCH_SIZE = 5;      // Process 5 emails at a time for better AI accuracy
const SEARCH_WINDOW = '2d'; // How far back to look for unread emails


// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

function processRecentJobEmails() {
  // Exclude reply threads (-subject:Re:) and non-job emails
  const searchQuery = `is:unread newer_than:${SEARCH_WINDOW} ("ISB Jobs" OR "Non-ISB Jobs" OR "ISB/Non-ISB Jobs" OR Job OR Opportunity) -subject:Resume -subject:CV -subject:"seeking opportunity" -subject:Re:`;
  const threads = GmailApp.search(searchQuery);

  const messagesToProcess = [];
  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      if (message.isUnread()) {
        messagesToProcess.push(message);
      }
    }
  }

  if (messagesToProcess.length === 0) {
    Logger.log("No new unread job emails found.");
    return;
  }

  Logger.log(`Found ${messagesToProcess.length} emails. Processing in batches of ${BATCH_SIZE}.`);

  for (let i = 0; i < messagesToProcess.length; i += BATCH_SIZE) {
    const batch = messagesToProcess.slice(i, i + BATCH_SIZE);
    Logger.log(`--- Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (emails ${i + 1}–${i + batch.length}) ---`);
    processBatch(batch);
  }
}


// ─── BATCH PROCESSOR ──────────────────────────────────────────────────────────

function processBatch(messages) {
  let batchedEmailText = "";

  messages.forEach((message, idx) => {
    const sender    = message.getFrom();
    const subject   = message.getSubject();
    const threadId  = message.getThread().getId();
    const emailLink = `https://mail.google.com/mail/u/0/#all/${threadId}`;
    const cleanBody = cleanEmailBody(message.getPlainBody());

    // Pre-parse ISB type from subject — passed as a strong hint to the AI
    const isbHint = parseIsbType(subject);

    batchedEmailText += `\n\n--- EMAIL ${idx + 1} ---\n`;
    batchedEmailText += `Sender: ${sender}\n`;
    batchedEmailText += `Email Link: ${emailLink}\n`;
    batchedEmailText += `Subject: ${subject}\n`;
    batchedEmailText += `ISB Type (parsed from subject): ${isbHint}\n`;
    batchedEmailText += `Body:\n${cleanBody}\n`;
  });

  const extractedDataArray = extractJobDataWithGemini(batchedEmailText);

  if (extractedDataArray && Array.isArray(extractedDataArray)) {
    Logger.log(`Batch extracted ${extractedDataArray.length} job(s).`);
    Logger.log(JSON.stringify(extractedDataArray, null, 2));

    const isSaved = sendJobsToSupabase(extractedDataArray);
    if (isSaved) {
      messages.forEach(msg => msg.markRead());
      Logger.log("Batch: emails marked as read.");
    } else {
      Logger.log("Batch: Supabase insert failed — emails kept unread to prevent data loss.");
    }
  } else {
    Logger.log("Batch: extraction failed or returned invalid format — emails remain unread.");
  }
}


// ─── ISB TYPE PRE-PARSER ──────────────────────────────────────────────────────
// Handles the inconsistent subject line formats seen in the alumni mailing list:
//   <ISB Jobs>, <Non-ISB Jobs>, <ISB/Non-ISB Jobs>, [ISB jobs], ISB Jobs:, etc.

function parseIsbType(subject) {
  const s = subject.toUpperCase();
  const hasNonIsb  = /NON[\s\-\/]*ISB/.test(s);
  const hasBothIsb = /ISB[\s\/]*NON[\s\/]*ISB|NON[\s\/]*ISB[\s\/]*ISB/.test(s); // "ISB/Non-ISB"
  const hasIsb     = /\bISB\b/.test(s);

  if (hasBothIsb) return "Non-ISB job"; // "ISB/Non-ISB" → open to all → not exclusive
  if (hasNonIsb)  return "Non-ISB job";
  if (hasIsb)     return "ISB job";
  return "Unknown";
}


// ─── EMAIL BODY CLEANER ───────────────────────────────────────────────────────
// Decodes quoted-printable encoding (=3D, =E2=80=94, soft line breaks etc.)
// so the AI receives clean readable text instead of encoded gibberish.

function cleanEmailBody(rawBody) {
  if (!rawBody) return "";
  return rawBody
    .replace(/=\r?\n/g, '')                                          // Remove soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)))                        // Decode =3D → =, =E2 → â, etc.
    .replace(/\r\n/g, '\n')                                          // Normalize line endings
    .replace(/[ \t]{3,}/g, '  ')                                     // Collapse excessive whitespace
    .trim();
}


// ─── GEMINI EXTRACTION ────────────────────────────────────────────────────────

function extractJobDataWithGemini(batchedEmails) {
  const API_KEY = GEMINI_API_KEY;

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite-preview'
  ];

  const now = new Date();
  const currentTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });

  const prompt = `
You are an expert recruitment assistant parsing job listings from alumni network emails.
Extract job details from ALL emails below.

<context>
Current time: ${currentTime} (IST).
This is the ISB (Indian School of Business) alumni mailing list.
"ISB job" means the role is exclusively shared for ISB alumni (typically the poster works there and is actively referring).
"Non-ISB job" means it is an open posting shared with the network, not exclusively for ISB alumni.
</context>

CRITICAL RULES:
1. Return ONLY a raw JSON ARRAY. No markdown, no \`\`\`json fences.
2. One object per job. If an email has multiple roles, create a separate object for each.
3. Skip emails that are pure chatter (no actual job listing).
4. For isb_job_type: use the "ISB Type (parsed from subject)" hint provided — trust it unless the email body clearly contradicts it.
5. For work_model: normalize WFO → "Onsite", WFH → "Remote", on-site/in-office → "Onsite", hybrid/flexible → "Hybrid". Default "Unknown" if unclear.
6. For job_description: write a concise 2–4 sentence summary of the role from the email body. If the email only has a link and no description, return null.
7. For salary_range: extract the compensation if mentioned (e.g., "₹20–32 LPA", "₹40L + equity"). Return null if not mentioned.
8. For application_link: use the direct job application URL if present. If only an email address is given, use "mailto:email@domain.com". If the body says "share CV with me" and no other link exists, use the sender's email. Return null if none.

Use exactly these keys for each object:
- job_title (string)
- company (string)
- location (string, e.g., "Bengaluru", "Remote", "Mumbai / Bangalore")
- work_model (string: "Remote", "Hybrid", "Onsite", or "Unknown")
- isb_job_type (string: "ISB job", "Non-ISB job", or "Unknown")
- job_function (string: e.g., "Product", "Marketing", "Engineering", "Finance", "Sales", "Strategy", "Operations")
- experience_level (string: e.g., "3–6 years", "Senior", "Entry-level"; use what the email says)
- job_poster (string: full name and email of the sender, e.g., "Ashish Verma <ashishvx@amazon.com>")
- application_link (string or null)
- email_link (string: the Gmail link from the email metadata block)
- job_description (string or null: 2–4 sentence summary of the role)
- salary_range (string or null: compensation if mentioned)

Batched Emails:
${batchedEmails}
  `.trim();

  const payload = {
    "contents": [{ "parts": [{ "text": prompt }] }],
    "generationConfig": { "response_mime_type": "application/json" }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const maxRetriesPerModel = 3;

  for (const currentModel of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${API_KEY}`;
    Logger.log(`--- Trying model: ${currentModel} ---`);

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        Logger.log(`Attempt ${attempt}/${maxRetriesPerModel}...`);
        const response     = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();

        if (responseCode !== 200) throw new Error(`HTTP ${responseCode}: ${responseText}`);

        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.candidates?.[0]) {
          return JSON.parse(jsonResponse.candidates[0].content.parts[0].text);
        }
        throw new Error("Unexpected Gemini response structure.");

      } catch (error) {
        Logger.log(`Error (${currentModel}, attempt ${attempt}): ${error.message}`);
        if (attempt < maxRetriesPerModel) {
          const wait = Math.pow(2, attempt) * 1000;
          Logger.log(`Waiting ${wait / 1000}s before retry...`);
          Utilities.sleep(wait);
        }
      }
    }
    Logger.log(`Exhausted retries for ${currentModel}. Trying next model.`);
  }

  Logger.log("CRITICAL: All models and retries failed.");
  return null;
}


// ─── SUPABASE INSERT ──────────────────────────────────────────────────────────
// Uses upsert with on_conflict=email_link to skip duplicates.
// REQUIREMENT: Add a UNIQUE constraint on the email_link column in Supabase:
//   ALTER TABLE jobs ADD CONSTRAINT jobs_email_link_key UNIQUE (email_link);
//
// NEW COLUMNS REQUIRED in Supabase for new fields:
//   ALTER TABLE jobs ADD COLUMN job_description text;
//   ALTER TABLE jobs ADD COLUMN salary_range text;

function sendJobsToSupabase(jobsArray) {
  // Only include columns that exist in the Supabase schema.
  // Add job_description and salary_range after running the ALTER TABLE commands above.
  const knownColumns = [
    'job_title', 'company', 'location', 'work_model', 'isb_job_type',
    'job_function', 'experience_level', 'job_poster', 'application_link',
    'email_link', 'job_description', 'salary_range'
  ];

  const sanitized = jobsArray.map(job => {
    const clean = {};
    for (const col of knownColumns) {
      if (job[col] !== undefined) clean[col] = job[col];
    }
    return clean;
  });

  // ?on_conflict=email_link tells Supabase to skip rows where email_link already exists
  const url = `${SUPABASE_URL}/rest/v1/jobs?on_conflict=email_link`;

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=ignore-duplicates,return=minimal'
    },
    payload: JSON.stringify(sanitized),
    muteHttpExceptions: true
  };

  try {
    const response     = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 201 || responseCode === 200) {
      Logger.log(`Supabase: ${sanitized.length} job(s) upserted successfully.`);
      return true;
    } else {
      Logger.log(`Supabase error ${responseCode}: ${response.getContentText()}`);
      return false;
    }
  } catch (error) {
    Logger.log(`Supabase network error: ${error.message}`);
    return false;
  }
}
