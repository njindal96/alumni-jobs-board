# Alumni Jobs Board

A modern, responsive job board platform tailored for alumni network members. Built with Next.js and powered by Supabase.

## Features

- **Light Theme UI**: Clean, minimalist design with Plus Jakarta Sans typography
- **Three-Panel Layout**: Sidebar filters + job list + detail panel
- **Advanced Filtering**: Filter by date posted, job function, company, location, experience level, and work model
- **Search**: Full-text search across job titles and companies
- **Save/Bookmark**: Save jobs for later with the star toggle
- **Mobile Responsive**: Full-width list on mobile, detail view as overlay
- **Real-time Data**: Jobs synced from Supabase database

## Architecture

### Data Pipeline
- **Email Extractor**: Implemented using Google Apps Script
  - Monitors alumni network email inbox
  - Parses job opportunities from emails
  - Extracts job details (title, company, location, work model, etc.)
  - Automatically pushes data to Supabase

- **Database**: Supabase PostgreSQL
  - Stores all job postings
  - Real-time updates when new jobs are added
  - Secure API access via Supabase client

- **Frontend**: Next.js 16 with React 19
  - Client-side rendering with Supabase SDK
  - Responsive UI with Tailwind CSS v4
  - Fast performance with React Compiler

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account with a jobs table

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation & Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# or with yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Schema

The Supabase `jobs` table should contain the following columns:

```
- id (uuid, primary key)
- created_at (timestamp)
- job_title (text)
- company (text)
- location (text)
- work_model (text) — Remote, Hybrid, Onsite
- isb_job_type (text) — "ISB job" for exclusive posts, null for others
- job_function (text) — Job function category
- experience_level (text) — Entry, Mid, Senior, Leadership
- job_poster (text) — Name of the person who posted
- application_link (text) — URL, email, or plain text instructions
- email_link (text) — Link to original email thread
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx        # Main JobsBoard component
│   ├── layout.tsx      # Root layout with metadata
│   └── globals.css     # Theme variables and Tailwind config
└── ...
```

## Technologies

- **Framework**: Next.js 16.2
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS v4
- **Icons**: Inline SVG (lucide-react style)
- **Database**: Supabase
- **Font**: Plus Jakarta Sans
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel (recommended)

## Filtering & Search

- **Date Posted**: Filter jobs by when they were posted
- **Job Function**: Multi-select filter with counts
- **Company**: Searchable company filter
- **Location**: Searchable location filter
- **Experience Level**: Entry, Mid, Senior, Leadership
- **Work Model**: Remote, Hybrid, Onsite
- **ISB Exclusive**: Toggle to show only ISB-exclusive opportunities
- **Text Search**: Search by job title or company name
- **Saved**: View only bookmarked jobs

## Deployment

The application is optimized for deployment on [Vercel](https://vercel.com):

```bash
npm run build
npm start
```

For production, set environment variables in your deployment platform's settings.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

## License

This project is part of the Alumni Jobs Board initiative.
