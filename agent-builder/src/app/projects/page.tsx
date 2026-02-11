'use client'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Plus, Search, Trash2, Clock, GitBranch } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    if (!user) return
    loadProjects()
  }, [user])

  async function loadProjects() {
    setLoadingProjects(true)
    const { data } = await supabase.from('agent_projects').select('*').eq('user_id', user!.id).order('updated_at', { ascending: false })
    setProjects((data as Project[]) || [])
    setLoadingProjects(false)
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return
    await supabase.from('agent_projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function createNew() {
    if (!user) return
    const { data } = await supabase.from('agent_projects').insert({
      user_id: user.id, name: 'Untitled Agent', description: '', nodes: [], edges: [], status: 'draft'
    }).select().single()
    if (data) router.push(`/builder?project=${data.id}`)
  }

  if (loading) return <div className="min-h-screen pt-24 flex justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>

  if (!user) return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Sign in to view your projects</h1>
      <Link href="/auth/login" className="px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#8b5cf6' }}>Sign In</Link>
    </div>
  )

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} agent{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium" style={{ background: '#8b5cf6' }}>
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {projects.length > 3 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>
      )}

      {loadingProjects ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold mb-2">No agents yet</h2>
          <p className="text-gray-500 mb-6">Create your first AI agent or start from a template</p>
          <div className="flex gap-3 justify-center">
            <button onClick={createNew} className="px-4 py-2 rounded-xl text-white font-medium" style={{ background: '#8b5cf6' }}>Create New</button>
            <Link href="/templates" className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition">Browse Templates</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => (
            <Link key={project.id} href={`/builder?project=${project.id}`}
              className="group bg-gray-900 rounded-xl border border-white/10 p-5 hover:border-purple-500/50 transition">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white group-hover:text-purple-400 transition">{project.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === 'deployed' ? 'bg-green-500/20 text-green-400' : project.status === 'published' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                  {project.status}
                </span>
              </div>
              {project.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {(project.nodes as any[])?.length || 0} nodes</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                <button onClick={e => { e.preventDefault(); deleteProject(project.id) }} className="p-1 hover:text-red-400 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
