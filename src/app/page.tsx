"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

type Job = {
  id: string;
  created_at: string;
  job_title: string;
  company: string;
  location: string;
  work_model: string;
  isb_job_type: string;
  job_function: string;
  experience_level: string;
  job_poster: string;
  application_link: string;
  email_link: string;
  job_description: string | null;
  salary_range: string | null;
};

type Filters = {
  isbOnly: boolean;
  datePosted: string;
  workModels: string[];
  functions: string[];
  experienceLevels: string[];
  locations: string[];
  companies: string[];
};

const INIT_FILTERS: Filters = {
  isbOnly: false,
  datePosted: "any",
  workModels: [],
  functions: [],
  experienceLevels: [],
  locations: [],
  companies: [],
};

const postedDays = (created_at: string) =>
  Math.floor(Math.abs(Date.now() - new Date(created_at).getTime()) / 864e5);

const timeAgo = (created_at: string) => {
  if (!created_at) return "Recently";
  const hours = Math.abs(Date.now() - new Date(created_at).getTime()) / 36e5;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconX = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
    <path d="M2.5 2.5L10.5 10.5M10.5 2.5L2.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconChevDown = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
    <path d="M2.5 4.5L6.5 8.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconClock = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M5.5 3V5.5L7 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 5L7 8.5L13 5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const IconExternal = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M5 2H2C1.45 2 1 2.45 1 3V11C1 11.55 1.45 12 2 12H10C10.55 12 11 11.55 11 11V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M7.5 1H12V5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 1L6 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3">
    <path d="M7 1.5L8.5 5.1L12.3 5.65L9.65 8.22L10.3 12L7 10.2L3.7 12L4.35 8.22L1.7 5.65L5.5 5.1L7 1.5Z"/>
  </svg>
);

const IconSort = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M1 3H12M3 6.5H10M5 10H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconWorkModel = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <rect x=".6" y="2.8" width="8.8" height="6.6" rx="1.1" stroke="currentColor" strokeWidth="1"/>
    <path d="M3.2 2.8V2.2C3.2 1.76 3.56 1.4 4 1.4H6C6.44 1.4 6.8 1.76 6.8 2.2V2.8" stroke="currentColor" strokeWidth="1"/>
    <circle cx="5" cy="6" r="1" fill="currentColor"/>
  </svg>
);

const IconLocation = () => (
  <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
    <path d="M4.5.75C2.84.75 1.5 2.09 1.5 3.75c0 2.06 3 7 3 7s3-4.94 3-7C7.5 2.09 6.16.75 4.5.75Z" stroke="currentColor" strokeWidth="1"/>
    <circle cx="4.5" cy="3.75" r="1" fill="currentColor"/>
  </svg>
);

const IconCategory = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <rect x=".6" y=".6" width="3.6" height="3.6" rx=".7" stroke="currentColor" strokeWidth="1"/>
    <rect x="5.8" y=".6" width="3.6" height="3.6" rx=".7" stroke="currentColor" strokeWidth="1"/>
    <rect x=".6" y="5.8" width="3.6" height="3.6" rx=".7" stroke="currentColor" strokeWidth="1"/>
    <rect x="5.8" y="5.8" width="3.6" height="3.6" rx=".7" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 3h12M3.5 7h7M6 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
    <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
  </svg>
);

// ─── Tag ──────────────────────────────────────────────────────────────────────

type TagKind = "workModel" | "location" | "function" | undefined;

const Tag = ({ label, kind }: { label: string; kind?: TagKind }) => {
  const palette: Record<string, { bg: string; text: string }> = {
    Remote: { bg: "#dcfce7", text: "#166534" },
    Hybrid: { bg: "#e0f2fe", text: "#075985" },
    Onsite: { bg: "#fef3c7", text: "#92400e" },
  };
  const colors = palette[label] || { bg: "var(--tag-bg)", text: "var(--tag-text)" };
  const icons: Record<string, React.ReactNode> = {
    workModel: <IconWorkModel />,
    location: <IconLocation />,
    function: <IconCategory />,
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 99,
      background: colors.bg, color: colors.text,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {kind && icons[kind]}{label}
    </span>
  );
};

// ─── CheckboxItem ─────────────────────────────────────────────────────────────

const CheckboxItem = ({
  checked, onChange, label, count,
}: {
  checked: boolean; onChange: () => void; label: string; count?: number;
}) => (
  <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "4px 0", userSelect: "none" }}>
    <span style={{
      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
      border: `1.5px solid ${checked ? "var(--accent)" : "var(--border)"}`,
      background: checked ? "var(--accent)" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.12s",
    }}>
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.2 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </span>
    <span style={{ flex: 1, fontSize: 12, color: "var(--text-2)" }}>{label}</span>
    {count !== undefined && (
      <span style={{ fontSize: 10, color: "var(--text-3)", background: "var(--tag-bg)", borderRadius: 99, padding: "1px 6px" }}>{count}</span>
    )}
  </label>
);

// ─── FilterSection ────────────────────────────────────────────────────────────

const FilterSection = ({
  title, children, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>{title}</span>
        <IconChevDown open={open} />
      </button>
      {open && <div style={{ paddingBottom: 10 }}>{children}</div>}
    </div>
  );
};

// ─── SearchableList ───────────────────────────────────────────────────────────

const SearchableList = ({
  options, selected, onToggle, placeholder = "Search…", max = 5,
}: {
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder?: string;
  max?: number;
}) => {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const shown = expanded || q ? filtered : filtered.slice(0, max);

  return (
    <div>
      {options.length > max && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--bg)", borderRadius: 6, padding: "5px 9px", marginBottom: 7, border: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-3)", display: "flex" }}><IconSearch /></span>
          <input
            value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--text)", fontFamily: "inherit" }}
          />
          {q && (
            <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 0 }}>
              <IconX />
            </button>
          )}
        </div>
      )}
      {shown.map(o => (
        <CheckboxItem key={o.value} checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} label={o.label} count={o.count} />
      ))}
      {!q && !expanded && filtered.length > max && (
        <button onClick={() => setExpanded(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 11, fontWeight: 600, padding: "3px 0" }}>
          +{filtered.length - max} more
        </button>
      )}
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = ({
  filters, onFilter, jobs, onClose,
}: {
  filters: Filters;
  onFilter: (k: string, v: unknown) => void;
  jobs: Job[];
  onClose?: () => void;
}) => {
  const cnt = (key: keyof Job, val: string) => jobs.filter(j => j[key] === val).length;
  const uniq = (key: keyof Job) =>
    [...new Set(jobs.map(j => j[key]).filter(Boolean))].sort() as string[];

  const tog = (field: keyof Filters, val: string) => {
    const prev = filters[field] as string[];
    onFilter(field, prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: "var(--surface)", borderRight: "1px solid var(--border)",
      overflowY: "auto", padding: "16px 16px 24px",
      display: "flex", flexDirection: "column",
    }}>
      {/* Mobile close button */}
      {onClose && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Filters</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* ISB Toggle */}
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "All Opportunities", val: false },
          { label: "ISB Exclusive", val: true, badge: true },
        ].map(opt => {
          const active = filters.isbOnly === opt.val;
          return (
            <button
              key={String(opt.val)}
              onClick={() => onFilter("isbOnly", opt.val)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 12px",
                borderRadius: 8, border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "var(--accent-light)" : "transparent",
                cursor: "pointer", transition: "all 0.13s", textAlign: "left",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 99, background: active ? "var(--accent)" : "var(--border)", flexShrink: 0, transition: "background 0.13s" }} />
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "var(--accent)" : "var(--text-2)", flex: 1 }}>{opt.label}</span>
              {opt.badge && (
                <span style={{ fontSize: 9, fontWeight: 700, background: "var(--accent)", color: "white", borderRadius: 99, padding: "1px 6px" }}>ISB</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 4 }}>
        <FilterSection title="Date Posted">
          {[
            { l: "Any time", v: "any" },
            { l: "Last 24 hours", v: "1" },
            { l: "Last 7 days", v: "7" },
            { l: "Last 30 days", v: "30" },
          ].map(o => (
            <label key={o.v} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "4px 0", userSelect: "none" }}>
              <span style={{
                width: 13, height: 13, borderRadius: 99, flexShrink: 0,
                border: `1.5px solid ${filters.datePosted === o.v ? "var(--accent)" : "var(--border)"}`,
                background: filters.datePosted === o.v ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}>
                {filters.datePosted === o.v && <span style={{ width: 4, height: 4, borderRadius: 99, background: "white" }} />}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-2)" }}>{o.l}</span>
            </label>
          ))}
        </FilterSection>

        <FilterSection title="Job Function">
          <SearchableList
            options={uniq("job_function").map(v => ({ value: v, label: v, count: cnt("job_function", v) }))}
            selected={filters.functions}
            onToggle={v => tog("functions", v)}
            placeholder="Search functions…"
          />
        </FilterSection>

        <FilterSection title="Company" defaultOpen={false}>
          <SearchableList
            options={uniq("company").map(v => ({ value: v, label: v, count: cnt("company", v) }))}
            selected={filters.companies}
            onToggle={v => tog("companies", v)}
            placeholder="Search companies…"
          />
        </FilterSection>

        <FilterSection title="Location" defaultOpen={false}>
          <SearchableList
            options={uniq("location").map(v => ({ value: v, label: v, count: cnt("location", v) }))}
            selected={filters.locations}
            onToggle={v => tog("locations", v)}
            placeholder="Search cities…"
          />
        </FilterSection>

        <FilterSection title="Experience Level" defaultOpen={false}>
          <SearchableList
            options={uniq("experience_level").map(v => ({ value: v, label: v, count: cnt("experience_level", v) }))}
            selected={filters.experienceLevels}
            onToggle={v => tog("experienceLevels", v)}
          />
        </FilterSection>

        <FilterSection title="Work Model" defaultOpen={false}>
          <SearchableList
            options={uniq("work_model").map(v => ({ value: v, label: v, count: cnt("work_model", v) }))}
            selected={filters.workModels}
            onToggle={v => tog("workModels", v)}
          />
        </FilterSection>
      </div>
    </aside>
  );
};

// ─── ActiveChips ──────────────────────────────────────────────────────────────

const ActiveChips = ({
  filters, onRemove,
}: {
  filters: Filters;
  onRemove: (k: string, v: string | null) => void;
}) => {
  const chips: { label: string; key: string; val: string | null }[] = [];
  const dLabel: Record<string, string> = { "1": "Last 24h", "7": "Last 7 days", "30": "Last 30 days" };
  if (filters.datePosted !== "any") chips.push({ label: dLabel[filters.datePosted], key: "datePosted", val: null });
  (["workModels", "functions", "experienceLevels", "locations", "companies"] as (keyof Filters)[]).forEach(k =>
    (filters[k] as string[]).forEach(v => chips.push({ label: v, key: k, val: v }))
  );
  if (!chips.length) return null;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5,
      padding: "8px 16px", borderBottom: "1px solid var(--border)",
      background: "var(--surface)", flexShrink: 0,
    }}>
      {chips.map((c, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px 3px 11px", borderRadius: 99,
          background: "var(--accent)", color: "white", fontSize: 11, fontWeight: 600,
        }}>
          {c.label}
          <button
            onClick={() => onRemove(c.key, c.val)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "white", display: "flex", padding: 0, opacity: 0.75 }}
          >
            <IconX size={10} />
          </button>
        </span>
      ))}
      <button
        onClick={() => onRemove("__all__", null)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 11, fontWeight: 600, padding: "3px 6px", borderRadius: 99 }}
      >
        Clear all
      </button>
    </div>
  );
};

// ─── ListCard ─────────────────────────────────────────────────────────────────

const ListCard = ({
  job, selected, onClick, saved, onSave,
}: {
  job: Job; selected: boolean; onClick: () => void; saved: boolean; onSave: (id: string) => void;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "14px 16px", cursor: "pointer",
        background: selected ? "var(--accent-light)" : hov ? "var(--bg)" : "transparent",
        borderLeft: `3px solid ${selected ? "var(--accent)" : "transparent"}`,
        borderBottom: "1px solid var(--border)",
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {job.isb_job_type === "ISB job" && (
            <span style={{ fontSize: 9, fontWeight: 700, background: "var(--accent-light)", color: "var(--accent)", borderRadius: 3, padding: "1px 6px", marginBottom: 4, display: "inline-block" }}>ISB</span>
          )}
          <div style={{
            fontSize: 13, fontWeight: 700, lineHeight: 1.3,
            color: selected ? "var(--accent)" : "var(--text)",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {job.job_title}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSave(job.id); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: saved ? "var(--accent)" : "var(--text-3)", padding: 2, flexShrink: 0, marginTop: 2, display: "flex", transition: "color 0.12s" }}
        >
          <IconStar filled={saved} />
        </button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 7 }}>
        {job.company}{job.location ? ` · ${job.location}` : ""}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 7 }}>
        {job.work_model && <Tag label={job.work_model} kind="workModel" />}
        {job.job_function && <Tag label={job.job_function} kind="function" />}
        {job.experience_level && <Tag label={job.experience_level} />}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-3)" }}>
          <IconClock />{timeAgo(job.created_at)}
        </span>
      </div>
    </div>
  );
};

// ─── DetailView ───────────────────────────────────────────────────────────────

const DetailView = ({
  job, saved, onSave, onBack,
}: {
  job: Job | null; saved: boolean; onSave: (id: string) => void; onBack?: () => void;
}) => {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!job) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--text-3)" }}>
      <IconEmpty />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Select a role to view details</div>
      <div style={{ fontSize: 12 }}>Click any job from the list on the left</div>
    </div>
  );

  const link = job.application_link?.trim();
  const isWebLink = link?.startsWith("http://") || link?.startsWith("https://");
  const isEmail = link && link.includes("@") && !link.startsWith("http");

  const ctaStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "11px 24px", borderRadius: 9,
    background: "var(--accent)", color: "#fff",
    fontSize: 14, fontWeight: 700, textDecoration: "none",
    marginBottom: 24, cursor: "pointer",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", background: "var(--bg)" }}>
      {/* Back button (mobile) */}
      {onBack && (
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}
        >
          <IconArrowLeft /> Back to list
        </button>
      )}

      {/* Title block */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            {job.isb_job_type === "ISB job" && (
              <span style={{ fontSize: 10, fontWeight: 700, background: "var(--accent-light)", color: "var(--accent)", borderRadius: 4, padding: "2px 9px", marginBottom: 8, display: "inline-block" }}>ISB Exclusive</span>
            )}
            <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, color: "var(--text)", marginTop: 4 }}>{job.job_title}</h1>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 5 }}>{job.company}</div>
          </div>
          <button
            onClick={() => onSave(job.id)}
            style={{
              background: saved ? "var(--accent-light)" : "transparent",
              border: `1.5px solid ${saved ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 8, cursor: "pointer",
              color: saved ? "var(--accent)" : "var(--text-2)",
              padding: "8px 14px", display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, flexShrink: 0, transition: "all 0.13s",
            }}
          >
            <IconStar filled={saved} />{saved ? "Saved" : "Save"}
          </button>
        </div>

        {/* Meta tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {job.work_model && <Tag label={job.work_model} kind="workModel" />}
          {job.job_function && <Tag label={job.job_function} kind="function" />}
          {job.location && <Tag label={job.location} kind="location" />}
          {job.experience_level && <Tag label={job.experience_level} />}
        </div>

        {/* Posted time + source */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-3)" }}>
            <IconClock />Posted {timeAgo(job.created_at)}
          </span>
          {job.salary_range && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", background: "var(--tag-bg)", borderRadius: 6, padding: "2px 9px" }}>
              {job.salary_range}
            </span>
          )}
          {job.job_poster && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-3)" }}>
              <span style={{
                width: 18, height: 18, borderRadius: 99, background: "var(--tag-bg)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "var(--text-3)",
              }}>
                {job.job_poster[0].toUpperCase()}
              </span>
              via{" "}
              {job.email_link ? (
                <a
                  href={job.email_link} target="_blank" rel="noreferrer"
                  style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600, borderBottom: "1px dashed var(--accent)", paddingBottom: 1 }}
                >
                  {job.job_poster}
                </a>
              ) : (
                <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{job.job_poster}</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      {isWebLink ? (
        <a href={link} target="_blank" rel="noreferrer" style={ctaStyle}>
          <IconExternal /> Apply Now
        </a>
      ) : isEmail ? (
        <a href={`mailto:${link}`} style={ctaStyle}>
          <IconMail /> Email to Apply
        </a>
      ) : link ? (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowInstructions(s => !s)}
            style={{ ...ctaStyle, border: "none" }}
          >
            {showInstructions ? "Hide Instructions" : "View Instructions"}
          </button>
          {showInstructions && (
            <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {link}
            </div>
          )}
        </div>
      ) : job.email_link ? (
        <a href={job.email_link} target="_blank" rel="noreferrer" style={ctaStyle}>
          <IconExternal /> View Original Thread
        </a>
      ) : null}

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", marginBottom: 24 }} />

      {/* About the Role */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: 10 }}>About the Role</h3>
        {job.job_description ? (
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)" }}>
            {job.job_description}
          </p>
        ) : (
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-3)", fontStyle: "italic" }}>
            Details weren&apos;t included in the original email. Reach out directly to learn more and apply.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── JobsBoard ────────────────────────────────────────────────────────────────

export default function JobsBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(INIT_FILTERS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [sort, setSort] = useState<"recent" | "relevant">("recent");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error) setJobs(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const onFilter = (k: string, v: unknown) => {
    if (k === "__all__") { setFilters(INIT_FILTERS); return; }
    setFilters(f => ({ ...f, [k]: v }));
  };

  const removeChip = (k: string, v: string | null) => {
    if (k === "__all__") { setFilters(INIT_FILTERS); return; }
    if (k === "datePosted") { setFilters(f => ({ ...f, datePosted: "any" })); return; }
    setFilters(f => ({ ...f, [k]: (f[k as keyof Filters] as string[]).filter(x => x !== v) }));
  };

  const toggleSave = (id: string) => setSavedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const filtered = useMemo(() => {
    const results = jobs.filter(j => {
      if (tab === "saved" && !savedIds.has(j.id)) return false;
      if (search && !j.job_title?.toLowerCase().includes(search.toLowerCase()) && !j.company?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.isbOnly && j.isb_job_type !== "ISB job") return false;
      if (filters.datePosted !== "any" && postedDays(j.created_at) > parseInt(filters.datePosted)) return false;
      if (filters.workModels.length && !filters.workModels.includes(j.work_model)) return false;
      if (filters.functions.length && !filters.functions.includes(j.job_function)) return false;
      if (filters.experienceLevels.length && !filters.experienceLevels.includes(j.experience_level)) return false;
      if (filters.locations.length && !filters.locations.includes(j.location)) return false;
      if (filters.companies.length && !filters.companies.includes(j.company)) return false;
      return true;
    });
    return sort === "recent"
      ? [...results].sort((a, b) => postedDays(a.created_at) - postedDays(b.created_at))
      : results;
  }, [jobs, search, filters, tab, savedIds, sort]);

  // Auto-select first result when filtered set changes
  useEffect(() => {
    if (!filtered.find(j => j.id === selectedJob?.id)) {
      setSelectedJob(filtered[0] ?? null);
    }
  }, [filtered]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActive = filters.datePosted !== "any" || filters.workModels.length > 0 || filters.functions.length > 0 || filters.experienceLevels.length > 0 || filters.locations.length > 0 || filters.companies.length > 0;

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ padding: "0 16px", height: 54, display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1.5" y="3" width="11" height="8.5" rx="1.4" stroke="white" strokeWidth="1.3"/>
                <path d="M4.5 3V2.5C4.5 2.22 4.72 2 5 2H9C9.28 2 9.5 2.22 9.5 2.5V3" stroke="white" strokeWidth="1.3"/>
                <circle cx="7" cy="7.5" r="1.2" fill="white"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em", color: "var(--text)" }}>Alumni Jobs</span>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 380, display: "flex", alignItems: "center", gap: 7, background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 99, padding: "0 13px", height: 36 }}>
            <span style={{ color: "var(--text-3)", display: "flex" }}><IconSearch /></span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search roles, companies…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--text)", fontFamily: "inherit" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 0 }}>
                <IconX />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
            {([["all", `All (${jobs.length})`], ["saved", `Saved${savedIds.size > 0 ? ` (${savedIds.size})` : ""}`]] as [string, string][]).map(([t, l]) => (
              <button
                key={t} onClick={() => setTab(t as "all" | "saved")}
                style={{ padding: "5px 13px", borderRadius: 99, border: "none", background: tab === t ? "var(--accent-light)" : "transparent", color: tab === t ? "var(--accent)" : "var(--text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.13s" }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Active chips */}
      {hasActive && <ActiveChips filters={filters} onRemove={removeChip} />}

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Sidebar — hidden on mobile, overlay when sidebarOpen */}
        {/* Desktop */}
        <div className="hidden md:flex" style={{ flexShrink: 0 }}>
          <Sidebar filters={filters} onFilter={onFilter} jobs={jobs} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }}
            />
            <div style={{ position: "fixed", inset: "0 auto 0 0", zIndex: 50, display: "flex" }}>
              <Sidebar filters={filters} onFilter={onFilter} jobs={jobs} onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* Job List Panel */}
        <div
          className={`${detailOpen ? "hidden md:flex" : "flex"} md:max-w-[300px]`}
          style={{ width: "100%", flexShrink: 0, borderRight: "1px solid var(--border)", flexDirection: "column", overflow: "hidden", background: "var(--surface-2)" }}
        >
          {/* List header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Mobile filter button */}
              <button
                className="flex md:hidden"
                onClick={() => setSidebarOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", alignItems: "center" }}
              >
                <IconFilter />
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "role" : "roles"}`}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <IconSort />
              <select
                value={sort} onChange={e => setSort(e.target.value as "recent" | "relevant")}
                style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--text-2)", fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}
              >
                <option value="recent">Most recent</option>
                <option value="relevant">Most relevant</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-3)" }}>
                <div style={{ fontSize: 13 }}>Loading jobs…</div>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(job => (
                <ListCard
                  key={job.id} job={job}
                  selected={selectedJob?.id === job.id}
                  onClick={() => handleSelectJob(job)}
                  saved={savedIds.has(job.id)}
                  onSave={toggleSave}
                />
              ))
            ) : (
              <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-3)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>No results</div>
                <div style={{ fontSize: 12 }}>Try adjusting your filters</div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel — full width on mobile when open, flex-1 on desktop */}
        <div
          className={detailOpen ? "flex" : "hidden md:flex"}
          style={{ flex: 1, overflow: "hidden" }}
        >
          <DetailView
            job={selectedJob}
            saved={selectedJob ? savedIds.has(selectedJob.id) : false}
            onSave={toggleSave}
            onBack={detailOpen ? () => setDetailOpen(false) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
