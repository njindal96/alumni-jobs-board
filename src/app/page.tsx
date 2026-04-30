"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Search, 
  MapPin, 
  Building, 
  Briefcase, 
  ExternalLink, 
  Mail, 
  Clock, 
  Filter,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Globe,
  Loader2,
  X
} from "lucide-react";

// Initialize Supabase Client
// You can override these with environment variables in your Vercel or local .env.local
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
};

const ApplyButton = ({ job }: { job: Job }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const link = job.application_link?.trim();

  // Common Styles
  const primaryBtnClass = "px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0";
  const secondaryIconClass = "w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors border border-white/10 text-gray-300 hover:text-white shrink-0";
  const secondaryTextClass = "px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0";

  // State 4: Null or missing
  if (!link) {
    if (!job.email_link) return null;
    return (
      <a href={job.email_link} target="_blank" rel="noreferrer" className={primaryBtnClass}>
        View Original Email <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  const isWebLink = link.startsWith("http://") || link.startsWith("https://");
  const isEmail = link.includes("@") && !link.startsWith("http");

  // State 1: Standard web link
  if (isWebLink) {
    return (
      <div className="flex gap-2">
        {job.email_link && (
          <a href={job.email_link} target="_blank" rel="noreferrer" className={secondaryIconClass} title="Original Email">
            <Mail className="w-4 h-4" />
          </a>
        )}
        <a href={link} target="_blank" rel="noreferrer" className={primaryBtnClass}>
          Apply Now <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // State 2: Email address
  if (isEmail) {
    const extractedEmailMatch = link.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const emailAddress = extractedEmailMatch ? extractedEmailMatch[0] : link;
    const mailtoHref = `mailto:${emailAddress}`;
    
    return (
      <div className="flex gap-2">
        {job.email_link && (
          <a href={job.email_link} target="_blank" rel="noreferrer" className={secondaryIconClass} title="Original Email">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <a href={mailtoHref} className={primaryBtnClass}>
          Email to Apply <Mail className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // State 3: Plain text instructions
  return (
    <div className="flex flex-col items-end w-full">
      <div className="flex gap-2">
        {job.email_link && (
          <a href={job.email_link} target="_blank" rel="noreferrer" className={secondaryIconClass} title="Original Email">
            <Mail className="w-4 h-4" />
          </a>
        )}
        <button onClick={() => setShowInstructions(!showInstructions)} className={secondaryTextClass}>
          View Instructions
        </button>
      </div>
      
      {/* Expandable Instructions Section */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out w-full mt-3 ${showInstructions ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-blue-200 text-left">
          <strong className="text-white block mb-1">How to apply:</strong>
          <span className="leading-relaxed whitespace-pre-wrap">{link}</span>
        </div>
      </div>
    </div>
  );
};

export default function JobsBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [workModels, setWorkModels] = useState<string[]>([]);
  const [isbOnly, setIsbOnly] = useState(false);
  const [jobFunction, setJobFunction] = useState<string>("All");

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        // We only fetch client-side for this iteration as requested
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching jobs:", error);
          // In a real app we might show an error state, but let's default to empty
        } else {
          setJobs(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  // Compute unique filter options dynamically
  const uniqueJobFunctions = useMemo(() => {
    const functions = new Set(jobs.map((j) => j.job_function).filter(Boolean));
    return ["All", ...Array.from(functions).sort()];
  }, [jobs]);

  // Handle Work Model toggles
  const toggleWorkModel = (model: string) => {
    setWorkModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // Filter jobs based on all state criteria
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Text Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (job.job_title?.toLowerCase().includes(searchLower)) ||
        (job.company?.toLowerCase().includes(searchLower)) ||
        (job.location?.toLowerCase().includes(searchLower));

      // 2. Work Model (if none selected, show all)
      const matchesModel =
        workModels.length === 0 || workModels.includes(job.work_model);

      // 3. ISB Job Type
      const matchesIsb = !isbOnly || job.isb_job_type === "ISB job";

      // 4. Job Function
      const matchesFunction =
        jobFunction === "All" || job.job_function === jobFunction;

      return matchesSearch && matchesModel && matchesIsb && matchesFunction;
    });
  }, [jobs, searchQuery, workModels, isbOnly, jobFunction]);

  // Format date
  const timeAgo = (dateString: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-purple-500/30 overflow-hidden relative flex">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />

      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out glass border-r border-white/5 flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:relative lg:translate-x-0
        `}
      >
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg glow-purple">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Alumni Jobs
              </h1>
            </div>
            <button className="lg:hidden p-2 hover:bg-white/5 rounded-md" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Search */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                Search
              </label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Title, Company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>
            </div>

            {/* ISB Toggle */}
            <div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-100">ISB Exclusive</span>
                </div>
                <button
                  onClick={() => setIsbOnly(!isbOnly)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isbOnly ? "bg-purple-600" : "bg-white/10"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isbOnly ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            {/* Work Model */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                Work Model
              </label>
              <div className="flex flex-col gap-2">
                {["Remote", "Hybrid", "Onsite"].map((model) => (
                  <label key={model} className="flex items-center gap-3 group cursor-pointer">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${workModels.includes(model) ? "bg-blue-600 border-blue-500" : "bg-black/40 border-white/10 group-hover:border-white/30"}`}>
                      {workModels.includes(model) && <ChevronRight className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${workModels.includes(model) ? "text-white" : "text-gray-400 group-hover:text-gray-300"}`}>
                      {model}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Function */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                Job Function
              </label>
              <div className="relative">
                <select
                  value={jobFunction}
                  onChange={(e) => setJobFunction(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white appearance-none focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                >
                  {uniqueJobFunctions.map((fn) => (
                    <option key={fn} value={fn} className="bg-zinc-900">
                      {fn}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Filter className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/5">
          <p className="text-xs text-gray-500 text-center">
            Updated via automated email extraction
          </p>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 glass border-b border-white/5 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-md text-white">
            <Filter className="w-5 h-5" />
          </button>
        </header>

        {/* Header Stats & Title */}
        <div className="px-8 py-10 lg:py-12 pb-6 max-w-7xl mx-auto w-full shrink-0">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Discover Opportunities
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            {loading ? "Syncing the latest roles..." : `Showing ${filteredJobs.length} active roles tailored for our alumni network.`}
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 max-w-7xl mx-auto w-full custom-scrollbar">
          
          {loading ? (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-gray-400 text-sm animate-pulse">Loading jobs from Supabase...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="w-full h-64 glass-card rounded-2xl flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <Search className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">No matches found</h3>
              <p className="text-gray-400 max-w-sm text-sm">
                We couldn't find any roles matching your current filters. Try adjusting your search criteria or toggling off some filters.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setWorkModels([]);
                  setIsbOnly(false);
                  setJobFunction("All");
                }}
                className="mt-4 px-6 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="glass-card rounded-2xl p-6 flex flex-col group hover:-translate-y-1 transition-all duration-300 hover:glow-blue"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {job.job_title}
                      </h3>
                      <div className="flex items-center text-gray-400 text-sm gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span className="truncate">{job.company || "Confidential"}</span>
                      </div>
                    </div>
                    {job.isb_job_type === "ISB job" && (
                      <div className="ml-3 shrink-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        ISB
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {job.location || "Anywhere"}
                    </div>
                    {job.work_model && job.work_model !== "Unknown" && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                        <Globe className="w-3.5 h-3.5 text-green-400" />
                        {job.work_model}
                      </div>
                    )}
                    {job.job_function && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/5">
                        <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                        {job.job_function}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(job.created_at)}
                      </div>
                      <div className="flex-1 flex justify-end ml-4">
                        <ApplyButton job={job} />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </main>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
    </div>
  );
}
