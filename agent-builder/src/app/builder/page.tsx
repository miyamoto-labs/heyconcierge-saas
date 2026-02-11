'use client'
import { Canvas } from '@/components/builder/Canvas'
import { useAuth } from '@/components/auth/AuthProvider'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { NodeData, EdgeData } from '@/lib/types'

function BuilderContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const templateId = searchParams.get('template')
  const [projectData, setProjectData] = useState<{ nodes: NodeData[]; edges: EdgeData[]; name: string; description: string } | null>(null)
  const [loadingProject, setLoadingProject] = useState(false)

  useEffect(() => {
    async function load() {
      if (projectId) {
        setLoadingProject(true)
        try {
          const { data } = await supabase.from('agent_projects').select('*').eq('id', projectId).single()
          if (data) setProjectData({ nodes: data.nodes || [], edges: data.edges || [], name: data.name, description: data.description || '' })
        } catch (e) { /* table might not exist */ }
        setLoadingProject(false)
      } else if (templateId) {
        setLoadingProject(true)
        try {
          const { data } = await supabase.from('agent_templates').select('*').eq('id', templateId).single()
          if (data) setProjectData({ nodes: data.nodes || [], edges: data.edges || [], name: `${data.name} Agent`, description: data.description || '' })
        } catch (e) { /* table might not exist */ }
        setLoadingProject(false)
      } else {
        // Check sessionStorage for template data
        try {
          const stored = sessionStorage.getItem('template')
          if (stored) {
            const template = JSON.parse(stored)
            setProjectData({ nodes: template.nodes || [], edges: template.edges || [], name: `${template.name} Agent`, description: template.description || '' })
            sessionStorage.removeItem('template')
          } else {
            // Check for draft
            const draft = localStorage.getItem('agentforge_draft')
            if (draft) {
              const d = JSON.parse(draft)
              setProjectData({ nodes: d.nodes || [], edges: d.edges || [], name: d.name || 'Untitled Agent', description: d.description || '' })
            }
          }
        } catch (e) { /* ignore */ }
      }
    }
    load()
  }, [projectId, templateId])

  if (loading || loadingProject) return (
    <div className="h-screen flex items-center justify-center pt-16">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="pt-16">
      <Canvas
        projectId={projectId || undefined}
        initialNodes={projectData?.nodes}
        initialEdges={projectData?.edges}
        projectName={projectData?.name}
        projectDescription={projectData?.description}
      />
    </div>
  )
}

export default function BuilderPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center pt-16"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}><BuilderContent /></Suspense>
}
