"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Star, 
  Download, 
  Copy, 
  Shield,
  Clock,
  User,
  Terminal,
  FileText,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Wallet,
  Check
} from "lucide-react";
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Skill {
  id: string;
  name: string;
  description: string;
  long_description: string | null;
  author: string;
  author_verified: boolean;
  downloads: number;
  rating: number;
  reviews_count: number;
  price: number;
  verified: boolean;
  category: string;
  tags: string[];
  success_rate: number;
  updated_at: string;
  version: string;
  install_command: string | null;
  requirements: string[];
  endpoints: string[];
}

interface Review {
  id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const getBadgeStatus = (skill: Skill): 'verified' | 'warning' | 'danger' => {
  if (skill.verified && skill.success_rate > 85) return 'verified';
  if (skill.verified) return 'warning';
  return 'danger';
};

export default function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  const [skill, setSkill] = useState<Skill | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'reviews'>('overview');

  // Fetch skill data
  useEffect(() => {
    async function fetchSkill() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/skills/${id}`);
        if (res.status === 404) {
          setError("Skill not found");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch skill");
        
        const data = await res.json();
        setSkill(data);

        // Fetch reviews
        const reviewsRes = await fetch(`/api/skills/${id}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSkill();
  }, [id]);

  const handleInstall = async () => {
    if (!skill) return;
    
    if (skill.price > 0 && !isConnected) {
      setShowWalletPrompt(true);
      return;
    }
    
    setInstalling(true);
    try {
      await fetch(`/api/skills/${id}/install`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: address || null })
      });
      setSkill(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : null);
    } catch (err) {
      console.error("Install error:", err);
    } finally {
      setInstalling(false);
    }
  };

  const handleCopy = async () => {
    if (!skill?.install_command) return;
    await navigator.clipboard.writeText(skill.install_command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="pt-24 pb-16 px-6 md:px-10 max-w-[1200px] mx-auto relative z-10">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#00e87b]" />
          <span className="ml-3 text-[#6b7a94]">Loading skill...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !skill) {
    return (
      <div className="pt-24 pb-16 px-6 md:px-10 max-w-[1200px] mx-auto relative z-10">
        <div className="text-center py-32">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-[#ff3b4f] mb-4">{error || "Skill not found"}</p>
          <button 
            onClick={() => router.push("/skills")}
            className="border border-[#1a2235] text-[#e8ecf4] px-6 py-2.5 rounded-md font-semibold text-sm bg-transparent transition-all hover:border-[#00e87b] hover:bg-[#00e87b22] inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Skills
          </button>
        </div>
      </div>
    );
  }

  const status = getBadgeStatus(skill);

  return (
    <div className="pt-24 pb-16 px-6 md:px-10 max-w-[1200px] mx-auto relative z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6b7a94] mb-6 font-[family-name:var(--font-jetbrains)]">
        <Link href="/skills" className="hover:text-[#00e87b] transition-colors">Skills</Link>
        <span>/</span>
        <span className="text-[#e8ecf4]">{skill.name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header Card */}
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#1a2235] text-[#6b7a94] text-xs px-3 py-1 rounded font-[family-name:var(--font-jetbrains)]">
                    {skill.category}
                  </span>
                  <span className={`font-[family-name:var(--font-jetbrains)] text-[11px] py-1 px-2.5 rounded font-semibold ${
                    status === 'verified' ? 'bg-[#00e87b22] text-[#00e87b] border border-[#00e87b33]' :
                    status === 'warning' ? 'bg-[#ff8a2b15] text-[#ff8a2b] border border-[#ff8a2b33]' :
                    'bg-[#ff3b4f18] text-[#ff3b4f] border border-[#ff3b4f33]'
                  }`}>
                    {status === 'verified' ? '✓ VERIFIED' : status === 'warning' ? '⚠ REVIEW' : '✕ BLOCKED'}
                  </span>
                </div>
                <h1 className="font-[family-name:var(--font-space-mono)] text-3xl font-bold tracking-tight mb-3">
                  {skill.name}
                </h1>
                <p className="text-[#6b7a94] leading-relaxed">{skill.description}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center text-[#6b7a94]">
                <Download className="h-4 w-4 mr-2" />
                {skill.downloads.toLocaleString()} downloads
              </div>
              <div className="flex items-center text-[#ffb800]">
                <Star className="h-4 w-4 mr-2 fill-current" />
                {skill.rating.toFixed(1)} ({skill.reviews_count} reviews)
              </div>
              <div className="flex items-center text-[#00e87b]">
                <Shield className="h-4 w-4 mr-2" />
                {skill.success_rate}% success rate
              </div>
              <div className="flex items-center text-[#6b7a94]">
                <Clock className="h-4 w-4 mr-2" />
                Updated {formatDate(skill.updated_at)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl overflow-hidden">
            <div className="flex border-b border-[#1a2235]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'overview' 
                    ? 'text-[#00e87b] border-b-2 border-[#00e87b] bg-[#00e87b08]' 
                    : 'text-[#6b7a94] hover:text-[#e8ecf4]'
                }`}
              >
                <FileText className="h-4 w-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'api' 
                    ? 'text-[#00e87b] border-b-2 border-[#00e87b] bg-[#00e87b08]' 
                    : 'text-[#6b7a94] hover:text-[#e8ecf4]'
                }`}
              >
                <Terminal className="h-4 w-4" />
                API
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'reviews' 
                    ? 'text-[#00e87b] border-b-2 border-[#00e87b] bg-[#00e87b08]' 
                    : 'text-[#6b7a94] hover:text-[#e8ecf4]'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Reviews
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <div className="text-[#e8ecf4] whitespace-pre-wrap leading-relaxed">
                    {skill.long_description || skill.description}
                  </div>
                  
                  {skill.requirements.length > 0 && (
                    <div className="mt-8">
                      <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-semibold mb-4">Requirements</h3>
                      <ul className="space-y-2">
                        {skill.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-[#6b7a94]">
                            <span className="text-[#00e87b]">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8">
                    <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-semibold mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {skill.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="text-xs bg-[#1a2235] text-[#6b7a94] px-3 py-1.5 rounded font-[family-name:var(--font-jetbrains)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div>
                  <h3 className="font-[family-name:var(--font-space-mono)] text-lg font-semibold mb-2">Available Endpoints</h3>
                  <p className="text-[#6b7a94] text-sm mb-6">
                    These endpoints become available after installing the skill
                  </p>
                  {skill.endpoints.length > 0 ? (
                    <div className="space-y-2 font-[family-name:var(--font-jetbrains)] text-sm">
                      {skill.endpoints.map((endpoint, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#1a2235] rounded-lg">
                          <span className={
                            endpoint.startsWith("GET") ? "text-[#00e87b]" :
                            endpoint.startsWith("POST") ? "text-[#00c2ff]" :
                            endpoint.startsWith("PUT") ? "text-[#ff8a2b]" :
                            endpoint.startsWith("DELETE") ? "text-[#ff3b4f]" :
                            "text-[#6b7a94]"
                          }>
                            {endpoint.split(" ")[0]}
                          </span>
                          <span className="text-[#e8ecf4]">{endpoint.split(" ").slice(1).join(" ")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#3a4560]">No endpoints documented yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-[#1a2235] pb-4 last:border-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center text-[#ffb800]">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "fill-current" : "opacity-30"}`}
                                />
                              ))}
                            </div>
                            <span className="text-[#6b7a94] text-sm font-[family-name:var(--font-jetbrains)]">
                              {review.user_id}
                            </span>
                            <span className="text-[#3a4560] text-xs">•</span>
                            <span className="text-[#3a4560] text-xs">{formatDate(review.created_at)}</span>
                          </div>
                          {review.comment && (
                            <p className="text-[#6b7a94] text-sm">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#3a4560]" />
                      <p className="text-[#6b7a94]">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#0f1420] border border-[#1a2235] rounded-xl p-6 sticky top-24">
            {/* Price */}
            <div className="text-center mb-6">
              {skill.price === 0 ? (
                <span className="font-[family-name:var(--font-space-mono)] text-4xl font-bold text-[#00e87b]">Free</span>
              ) : (
                <div>
                  <span className="font-[family-name:var(--font-space-mono)] text-4xl font-bold text-[#e8ecf4]">${skill.price.toFixed(2)}</span>
                  <span className="text-xs text-[#6b7a94] block mt-1 font-[family-name:var(--font-jetbrains)]">USDC</span>
                </div>
              )}
            </div>

            {/* Wallet Prompt for Paid Skills */}
            {showWalletPrompt && skill.price > 0 && !isConnected && (
              <div className="p-4 bg-[#ff8a2b15] border border-[#ff8a2b33] rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-[#ff8a2b]" />
                  <span className="text-[#ff8a2b] font-medium text-sm">Connect wallet to purchase</span>
                </div>
                <ConnectButton />
              </div>
            )}

            {/* Install Button */}
            <button 
              onClick={handleInstall}
              disabled={installing || status === 'danger'}
              className={`w-full py-3 rounded-lg font-bold text-sm mb-4 transition-all flex items-center justify-center gap-2 ${
                status === 'danger' 
                  ? 'bg-[#ff3b4f33] text-[#ff3b4f] cursor-not-allowed'
                  : 'bg-[#00e87b] text-[#06080c] hover:shadow-[0_0_30px_#00e87b30] hover:-translate-y-0.5'
              }`}
            >
              {installing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'danger' ? (
                <>
                  <Shield className="h-4 w-4" />
                  Blocked for Security
                </>
              ) : skill.price > 0 ? (
                <>
                  <Wallet className="h-4 w-4" />
                  {isConnected ? `Pay ${skill.price} USDC` : "Buy & Install"}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Install Free
                </>
              )}
            </button>

            {/* Connected wallet indicator */}
            {isConnected && skill.price > 0 && (
              <div className="text-xs text-center text-[#6b7a94] mb-4 font-[family-name:var(--font-jetbrains)]">
                Paying from {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}

            {/* Install Command */}
            {skill.install_command && status !== 'danger' && (
              <div className="mb-6">
                <div className="flex items-center gap-2 p-3 bg-[#1a2235] rounded-lg font-[family-name:var(--font-jetbrains)] text-xs">
                  <Terminal className="h-4 w-4 text-[#3a4560] flex-shrink-0" />
                  <code className="text-[#e8ecf4] overflow-x-auto flex-1">{skill.install_command}</code>
                  <button 
                    onClick={handleCopy}
                    className="flex-shrink-0 text-[#6b7a94] hover:text-[#00e87b] transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-[#00e87b]" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-3 p-4 bg-[#1a2235] rounded-lg mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-[#00e87b] to-[#00c2ff] rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-[#06080c]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#e8ecf4]">{skill.author}</span>
                  {skill.author_verified && (
                    <span className="text-[#00e87b]">✓</span>
                  )}
                </div>
                <span className="text-xs text-[#6b7a94]">
                  {skill.author_verified ? "Verified Creator" : "Creator"}
                </span>
              </div>
            </div>

            {/* Version Info */}
            <div className="text-sm text-[#6b7a94] space-y-3 font-[family-name:var(--font-jetbrains)]">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-[#e8ecf4]">{skill.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated</span>
                <span className="text-[#e8ecf4]">{formatDate(skill.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Success Rate</span>
                <span className={skill.success_rate > 85 ? "text-[#00e87b]" : skill.success_rate > 70 ? "text-[#ff8a2b]" : "text-[#ff3b4f]"}>
                  {skill.success_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Security Score</span>
                <span className={status === 'verified' ? "text-[#00e87b]" : status === 'warning' ? "text-[#ff8a2b]" : "text-[#ff3b4f]"}>
                  {status === 'verified' ? 'A+' : status === 'warning' ? 'B' : 'F'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
