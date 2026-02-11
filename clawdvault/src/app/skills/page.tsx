"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads: number;
  rating: number;
  price: number;
  verified: boolean;
  category: string;
  tags: string[];
  success_rate?: number;
}

const getBadgeStatus = (skill: Skill): 'verified' | 'warning' | 'danger' => {
  if (skill.verified && (skill.success_rate ?? 90) > 85) return 'verified';
  if (skill.verified) return 'warning';
  return 'danger';
};

const getSkillIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Trading': '📈',
    'Social': '🐦',
    'Productivity': '⚡',
    'Analytics': '📊',
    'DeFi': '💰',
    'Security': '🔒',
    'Automation': '🤖',
  };
  return icons[category] || '📦';
};

const getIconColors = (status: 'verified' | 'warning' | 'danger'): { bg: string; border: string } => {
  if (status === 'verified') return { bg: '#00e87b15', border: '#00e87b33' };
  if (status === 'warning') return { bg: '#ff8a2b15', border: '#ff8a2b33' };
  return { bg: '#ff3b4f15', border: '#ff3b4f33' };
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"downloads" | "rating" | "newest">("downloads");

  // Fetch skills from API
  useEffect(() => {
    async function fetchSkills() {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "All") params.set("category", selectedCategory);
        if (searchQuery) params.set("search", searchQuery);
        params.set("sort", sortBy);

        const res = await fetch(`/api/skills?${params}`);
        if (!res.ok) throw new Error("Failed to fetch skills");
        
        const data = await res.json();
        setSkills(data.skills);
        setCategories(data.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, [selectedCategory, searchQuery, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {}, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="pt-24 pb-16 px-6 md:px-10 max-w-[1200px] mx-auto relative z-10">
      {/* Terminal-style Header */}
      <div className="mb-8">
        <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1a2235] flex items-center gap-3 font-[family-name:var(--font-jetbrains)] text-[13px] text-[#3a4560]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff3b4f]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff8a2b]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e87b]" />
            <span className="ml-2">trustclaw browse --all</span>
          </div>
          <div className="p-6">
            <h1 className="font-[family-name:var(--font-space-mono)] text-3xl font-bold tracking-tight mb-2">
              Browse Verified Skills
            </h1>
            <p className="text-[#6b7a94]">
              {skills.length} security-scanned skills available for your OpenClaw agent
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3a4560]" />
          <input
            type="text"
            placeholder="Search skills, tags, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-11 pr-4 border border-[#1a2235] rounded-lg bg-[#0f1420] text-[#e8ecf4] text-sm outline-none transition-colors focus:border-[#00e87b] placeholder:text-[#3a4560]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("downloads")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === "downloads" 
                ? "bg-[#00e87b] text-[#06080c]" 
                : "border border-[#1a2235] text-[#6b7a94] hover:border-[#00e87b] hover:text-[#00e87b]"
            }`}
          >
            Most Downloaded
          </button>
          <button
            onClick={() => setSortBy("rating")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === "rating" 
                ? "bg-[#00e87b] text-[#06080c]" 
                : "border border-[#1a2235] text-[#6b7a94] hover:border-[#00e87b] hover:text-[#00e87b]"
            }`}
          >
            Top Rated
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === category
                ? "bg-[#00e87b22] text-[#00e87b] border border-[#00e87b33]"
                : "border border-[#1a2235] text-[#6b7a94] hover:border-[#2a3555] hover:text-[#e8ecf4]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#00e87b]" />
          <span className="ml-3 text-[#6b7a94]">Loading skills...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-20">
          <p className="text-[#ff3b4f] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="border border-[#1a2235] text-[#e8ecf4] px-6 py-2.5 rounded-md font-semibold text-sm bg-transparent transition-all hover:border-[#00e87b] hover:bg-[#00e87b22]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Skills Grid */}
      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => {
            const status = getBadgeStatus(skill);
            const iconColors = getIconColors(status);
            
            return (
              <Link 
                key={skill.id} 
                href={`/skills/${skill.id}`}
                className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 transition-all hover:border-[#00e87b] hover:-translate-y-0.5 hover:shadow-[0_0_30px_#00e87b10] no-underline group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00e87b] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: iconColors.bg, border: `1px solid ${iconColors.border}` }}
                  >
                    {getSkillIcon(skill.category)}
                  </div>
                  <span className={`font-[family-name:var(--font-jetbrains)] text-[10px] py-1 px-2 rounded font-semibold ${
                    status === 'verified' ? 'bg-[#00e87b22] text-[#00e87b] border border-[#00e87b33]' :
                    status === 'warning' ? 'bg-[#ff8a2b15] text-[#ff8a2b] border border-[#ff8a2b33]' :
                    'bg-[#ff3b4f18] text-[#ff3b4f] border border-[#ff3b4f33]'
                  }`}>
                    {status === 'verified' ? '✓ VERIFIED' : status === 'warning' ? '⚠ REVIEW' : '✕ BLOCKED'}
                  </span>
                </div>

                <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-bold mb-1.5 tracking-tight text-[#e8ecf4]">
                  {skill.name}
                </h3>
                <p className="text-sm text-[#6b7a94] line-clamp-2 mb-4 leading-relaxed">
                  {skill.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {skill.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[10px] bg-[#1a2235] text-[#6b7a94] px-2 py-0.5 rounded font-[family-name:var(--font-jetbrains)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm pt-4 border-t border-[#1a2235]">
                  <span className="text-[#6b7a94] font-[family-name:var(--font-jetbrains)] text-xs">
                    {skill.downloads.toLocaleString()} downloads
                  </span>
                  <span className="text-[#ffb800] font-[family-name:var(--font-jetbrains)] text-xs">
                    ★ {skill.rating.toFixed(1)}
                  </span>
                  <span className={`font-semibold text-xs ${skill.price === 0 ? "text-[#00e87b]" : "text-[#e8ecf4]"}`}>
                    {skill.price === 0 ? "Free" : `$${skill.price.toFixed(2)}`}
                  </span>
                </div>
                <div className="text-[11px] text-[#3a4560] mt-2 font-[family-name:var(--font-jetbrains)]">
                  by {skill.author}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && skills.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-[#6b7a94] mb-4">No skills found matching your criteria</p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
            className="border border-[#1a2235] text-[#e8ecf4] px-6 py-2.5 rounded-md font-semibold text-sm bg-transparent transition-all hover:border-[#00e87b] hover:bg-[#00e87b22]"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
