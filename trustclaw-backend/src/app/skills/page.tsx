'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import SkillCard from '@/components/SkillCard'
import { Search, Loader2, LayoutGrid } from 'lucide-react'
import type { Skill } from '@/types/database'

const categories = [
  { value: '', label: 'All' },
  { value: 'automation', label: 'Automation' },
  { value: 'integration', label: 'Integration' },
  { value: 'utility', label: 'Utility' },
  { value: 'data', label: 'Data' },
  { value: 'security', label: 'Security' },
  { value: 'ai', label: 'AI & ML' },
]

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (category) params.set('category', category)
      
      const res = await fetch(`/api/skills?${params}`)
      const data = await res.json()
      setSkills(data.skills || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, category])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">
            Browse <span className="text-trust-green">Verified</span> Skills
          </h1>
          <p className="text-dark-muted text-lg max-w-2xl mx-auto">
            Every skill on TrustClaw has been security-scanned and verified. 
            Install with confidence.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-muted" />
          <input
            type="text"
            placeholder="Search skills by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-12 py-3 text-lg"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                category === cat.value
                  ? 'bg-trust-green text-dark-bg'
                  : 'bg-dark-card border border-dark-border text-dark-muted hover:border-trust-green/50 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-dark-muted text-sm">
              {skills.length} skill{skills.length !== 1 ? 's' : ''} found
              {category && ` in ${categories.find(c => c.value === category)?.label}`}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
          </div>
        )}

        {/* Skills Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-trust-green" />
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-dark-card border border-dark-border rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="h-8 w-8 text-dark-muted" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No skills found</h3>
            <p className="text-dark-muted text-sm">
              {search || category
                ? 'Try adjusting your search or filters'
                : 'Be the first to submit a skill!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-trust-green mb-2">
              {skills.length}
            </div>
            <div className="text-dark-muted text-sm">Verified Skills</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-trust-green mb-2">100%</div>
            <div className="text-dark-muted text-sm">Security Scanned</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-trust-green mb-2">0</div>
            <div className="text-dark-muted text-sm">Security Incidents</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-trust-green mb-2">24/7</div>
            <div className="text-dark-muted text-sm">Monitoring</div>
          </div>
        </div>
      </main>
    </>
  )
}
