'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { NodeData, EdgeData, ComponentDef, COMPONENTS } from '@/lib/types'
import { ComponentNode } from './ComponentNode'
import { ConnectionLines } from './ConnectionLine'
import { ComponentSidebar } from './ComponentSidebar'
import { ConfigPanel } from './ConfigPanel'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { generateExport } from '@/lib/export-generator'
import { Save, Download, Play, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Copy, Check, Lock, Eye, Rocket } from 'lucide-react'
import { PreviewPanel } from './PreviewPanel'
import JSZip from 'jszip'
import { useSubscription } from '@/hooks/useSubscription'
import { canExport } from '@/lib/plans'
import Link from 'next/link'

interface Props {
  projectId?: string
  initialNodes?: NodeData[]
  initialEdges?: EdgeData[]
  projectName?: string
  projectDescription?: string
}

interface HistoryState {
  nodes: NodeData[]
  edges: EdgeData[]
}

export function Canvas({ projectId, initialNodes, initialEdges, projectName: initName, projectDescription: initDesc }: Props) {
  const { user } = useAuth()
  const { subscription, isPro } = useSubscription()
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes || [])
  const [edges, setEdges] = useState<EdgeData[]>(initialEdges || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [projectName, setProjectName] = useState(initName || 'Untitled Agent')
  const [projectDesc, setProjectDesc] = useState(initDesc || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportFiles, setExportFiles] = useState<Record<string, string>>({})
  const [exportTab, setExportTab] = useState('')
  const [copiedFile, setCopiedFile] = useState('')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [running, setRunning] = useState(false)
  const [runHighlight, setRunHighlight] = useState<string | null>(null)
  const [runLog, setRunLog] = useState<string[]>([])
  const [showRunPanel, setShowRunPanel] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null)
  const currentProjectId = useRef(projectId || '')
  const lastSave = useRef(Date.now())

  // Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes || [], edges: initialEdges || [] }])
  const [historyIdx, setHistoryIdx] = useState(0)

  const pushHistory = useCallback((newNodes: NodeData[], newEdges: EdgeData[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1)
      next.push({ nodes: newNodes, edges: newEdges })
      if (next.length > 50) next.shift()
      return next
    })
    setHistoryIdx(prev => Math.min(prev + 1, 49))
  }, [historyIdx])

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1
      setHistoryIdx(newIdx)
      setNodes(history[newIdx].nodes)
      setEdges(history[newIdx].edges)
    }
  }, [historyIdx, history])

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1
      setHistoryIdx(newIdx)
      setNodes(history[newIdx].nodes)
      setEdges(history[newIdx].edges)
    }
  }, [historyIdx, history])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !(e.target as HTMLElement).closest('input, textarea, select')) {
          handleDeleteNode(selectedId)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, selectedId])

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && currentProjectId.current && nodes.length > 0 && Date.now() - lastSave.current > 25000) {
        handleSave(true)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [nodes, edges, user])

  const handleSave = async (auto = false) => {
    if (!user) {
      // Save to localStorage for non-authenticated users
      localStorage.setItem('agentforge_draft', JSON.stringify({ name: projectName, description: projectDesc, nodes, edges }))
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }
    setSaving(true)
    try {
      if (currentProjectId.current) {
        await supabase.from('agent_projects').update({
          name: projectName, description: projectDesc, nodes, edges, updated_at: new Date().toISOString()
        }).eq('id', currentProjectId.current)
      } else {
        const { data } = await supabase.from('agent_projects').insert({
          user_id: user.id, name: projectName, description: projectDesc, nodes, edges, status: 'draft'
        }).select().single()
        if (data) currentProjectId.current = data.id
      }
      lastSave.current = Date.now()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error('Save failed:', e) }
    setSaving(false)
  }

  const handleExport = () => {
    const files = generateExport(projectName, projectDesc, nodes, edges)
    setExportFiles(files)
    setExportTab(Object.keys(files)[0])
    setShowExport(true)
  }

  const handleRunTest = async () => {
    if (running || nodes.length === 0) return
    setRunning(true)
    setShowRunPanel(true)
    setRunLog([])

    // Topological sort
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const inDegree = new Map(nodes.map(n => [n.id, 0]))
    for (const e of edges) inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
    const queue = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id)
    const sorted: string[] = []
    const visited = new Set<string>()
    while (queue.length > 0) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      sorted.push(id)
      for (const e of edges.filter(e => e.source === id)) {
        const deg = (inDegree.get(e.target) || 1) - 1
        inDegree.set(e.target, deg)
        if (deg === 0) queue.push(e.target)
      }
    }
    // Add unvisited
    for (const n of nodes) { if (!visited.has(n.id)) sorted.push(n.id) }

    // Simulate execution
    for (const nodeId of sorted) {
      const node = nodeMap.get(nodeId)
      if (!node) continue
      setRunHighlight(nodeId)
      setRunLog(prev => [...prev, `▶ ${node.label} (${node.type})...`])
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
      const msgs: Record<string, string> = {
        schedule: `Triggered at ${new Date().toLocaleTimeString()}`,
        webhook: `Listening on ${node.config.path || '/webhook'}`,
        event: `Waiting for ${node.config.event_name || 'event'}`,
        manual: 'Manual trigger activated',
        call_api: `GET ${node.config.url || 'https://api.example.com'} → 200 OK`,
        llm_call: `${node.config.model || 'GPT-4o'}: Generated 247 tokens`,
        send_message: `Sent to ${node.config.channel || 'channel'}: "${(node.config.message || 'Hello!').slice(0, 40)}"`,
        if_else: `Condition: ${node.config.condition || 'true'} → true`,
        filter: `Filtered: 12 → 5 items`,
        switch: `Matched case: "${node.config.cases?.split(',')[0]?.trim() || 'default'}"`,
        summarize: `Summary: ${node.config.max_length || 200} words generated`,
        classify: `Classified as: "${node.config.categories?.split(',')[0]?.trim() || 'positive'}"`,
        extract: `Extracted ${node.config.fields?.split(',').length || 3} fields`,
        twitter: `${node.config.action || 'Post Tweet'}: Success`,
        telegram: `${node.config.action || 'Send Message'}: Delivered`,
        email: `${node.config.action || 'Send'}: Sent to ${node.config.to || 'user@email.com'}`,
        slack: `${node.config.action || 'Send Message'} to ${node.config.channel || '#general'}`,
        openclaw: `Skill "${node.config.skill || 'default'}" executed`,
        run_script: `Script executed in ${Math.floor(Math.random() * 500)}ms`,
        generate_text: `Generated text with ${node.config.model || 'GPT-4'}`,
      }
      setRunLog(prev => [...prev, `  ✓ ${msgs[node.type] || 'Completed'}`])
    }
    setRunLog(prev => [...prev, '', `✅ Test complete — ${sorted.length} steps executed successfully`])
    setRunHighlight(null)
    setRunning(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('component')
    if (!data) return
    const comp: ComponentDef = JSON.parse(data)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale
    const newNode: NodeData = {
      id: `node_${Date.now()}`,
      type: comp.type,
      category: comp.category,
      label: comp.label,
      icon: comp.icon,
      position: { x, y },
      config: {},
    }
    const newNodes = [...nodes, newNode]
    setNodes(newNodes)
    setSelectedId(newNode.id)
    pushHistory(newNodes, edges)
  }, [scale, pan, nodes, edges, pushHistory])

  const handleNodeMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position: { x, y } } : n))
  }

  const handleNodeMoveEnd = () => {
    pushHistory(nodes, edges)
  }

  const handleStartConnect = (id: string) => setConnectingFrom(id)
  const handleEndConnect = (targetId: string) => {
    if (connectingFrom && connectingFrom !== targetId) {
      const exists = edges.some(e => e.source === connectingFrom && e.target === targetId)
      if (!exists) {
        const newEdges = [...edges, { id: `edge_${Date.now()}`, source: connectingFrom, target: targetId }]
        setEdges(newEdges)
        pushHistory(nodes, newEdges)
      }
    }
    setConnectingFrom(null)
  }

  const handleUpdateConfig = (id: string, config: Record<string, any>) => {
    const newNodes = nodes.map(n => n.id === id ? { ...n, config } : n)
    setNodes(newNodes)
  }

  const handleDeleteNode = (id: string) => {
    const newNodes = nodes.filter(n => n.id !== id)
    const newEdges = edges.filter(e => e.source !== id && e.target !== id)
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedId(null)
    pushHistory(newNodes, newEdges)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvas) {
      setSelectedId(null)
      setConnectingFrom(null)
      if (e.button === 1 || e.altKey) {
        panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
        const move = (e: MouseEvent) => {
          if (!panRef.current) return
          setPan({ x: panRef.current.panX + e.clientX - panRef.current.startX, y: panRef.current.panY + e.clientY - panRef.current.startY })
        }
        const up = () => { panRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', up)
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    const newScale = Math.max(0.25, Math.min(2.5, scale - e.deltaY * 0.001))
    setScale(newScale)
  }

  const zoomIn = () => setScale(s => Math.min(2.5, s + 0.15))
  const zoomOut = () => setScale(s => Math.max(0.25, s - 0.15))
  const zoomFit = () => {
    if (nodes.length === 0) { setScale(1); setPan({ x: 0, y: 0 }); return }
    const xs = nodes.map(n => n.position.x)
    const ys = nodes.map(n => n.position.y)
    const minX = Math.min(...xs) - 100
    const maxX = Math.max(...xs) + 300
    const minY = Math.min(...ys) - 100
    const maxY = Math.max(...ys) + 200
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const scaleX = rect.width / (maxX - minX)
    const scaleY = rect.height / (maxY - minY)
    const newScale = Math.min(scaleX, scaleY, 1.5)
    setScale(newScale)
    setPan({ x: -minX * newScale + (rect.width - (maxX - minX) * newScale) / 2, y: -minY * newScale + (rect.height - (maxY - minY) * newScale) / 2 })
  }

  const selectedNode = nodes.find(n => n.id === selectedId) || null

  // Minimap
  const minimapSize = { w: 160, h: 100 }
  const allX = nodes.map(n => n.position.x)
  const allY = nodes.map(n => n.position.y)
  const mapBounds = nodes.length > 0 ? {
    minX: Math.min(...allX) - 50, maxX: Math.max(...allX) + 250,
    minY: Math.min(...allY) - 50, maxY: Math.max(...allY) + 150,
  } : { minX: 0, maxX: 1000, minY: 0, maxY: 600 }
  const mapScale = Math.min(minimapSize.w / (mapBounds.maxX - mapBounds.minX || 1), minimapSize.h / (mapBounds.maxY - mapBounds.minY || 1))

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950">
      <ComponentSidebar onDragStart={() => {}} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="bg-transparent text-white font-semibold text-lg focus:outline-none border-b border-transparent focus:border-purple-500 transition max-w-[200px]"
            />
            <span className="text-xs text-gray-500">{nodes.length} nodes · {edges.length} connections</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={undo} disabled={historyIdx <= 0} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (⌘Z)">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (⌘⇧Z)">
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={() => setShowPreview(!showPreview)} disabled={nodes.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition border border-white/10 disabled:opacity-40 ${showPreview ? 'bg-purple-600/30 text-purple-300 border-purple-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={handleRunTest} disabled={running || nodes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition border border-white/10 disabled:opacity-40 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
            >
              <Play className="w-3.5 h-3.5" /> {running ? 'Running...' : 'Test Run'}
            </button>
            <button onClick={() => handleSave()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition border border-white/10 bg-gray-800 text-gray-300 hover:bg-gray-700">
              {saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />} {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleExport} disabled={nodes.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white font-medium transition disabled:opacity-40" style={{ background: '#8b5cf6' }}>
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            data-canvas="true"
            className="absolute inset-0 cursor-default"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: `${20 * scale}px ${20 * scale}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onMouseDown={handleCanvasMouseDown}
            onWheel={handleWheel}
          >
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
              <ConnectionLines edges={edges} nodes={nodes} highlightNode={runHighlight} />
              {nodes.map(node => (
                <ComponentNode
                  key={node.id}
                  node={node}
                  selected={node.id === selectedId}
                  highlighted={node.id === runHighlight}
                  onSelect={() => setSelectedId(node.id)}
                  onMove={handleNodeMove}
                  onMoveEnd={handleNodeMoveEnd}
                  onStartConnect={handleStartConnect}
                  onEndConnect={handleEndConnect}
                  scale={scale}
                />
              ))}
            </div>
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-5xl mb-4 opacity-60">🎨</div>
                  <p className="text-gray-400 text-lg font-medium">Drag components from the sidebar</p>
                  <p className="text-gray-600 text-sm mt-2">Connect nodes by dragging from output ● to input ● ports</p>
                  <p className="text-gray-600 text-xs mt-4">Alt+Drag to pan · Scroll to zoom · ⌘Z to undo</p>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-white/10 p-1">
            <button onClick={zoomOut} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs text-gray-400 w-10 text-center font-mono">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"><ZoomIn className="w-4 h-4" /></button>
            <div className="w-px h-4 bg-white/10" />
            <button onClick={zoomFit} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition" title="Fit to view"><Maximize2 className="w-4 h-4" /></button>
          </div>

          {/* Minimap */}
          {nodes.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-xl border border-white/10 p-2" style={{ width: minimapSize.w + 16, height: minimapSize.h + 16 }}>
              <svg width={minimapSize.w} height={minimapSize.h}>
                {edges.map(edge => {
                  const s = nodes.find(n => n.id === edge.source)
                  const t = nodes.find(n => n.id === edge.target)
                  if (!s || !t) return null
                  return <line key={edge.id}
                    x1={(s.position.x - mapBounds.minX + 96) * mapScale}
                    y1={(s.position.y - mapBounds.minY + 40) * mapScale}
                    x2={(t.position.x - mapBounds.minX + 96) * mapScale}
                    y2={(t.position.y - mapBounds.minY + 40) * mapScale}
                    stroke="#8b5cf6" strokeWidth="1" opacity="0.4"
                  />
                })}
                {nodes.map(node => (
                  <rect key={node.id}
                    x={(node.position.x - mapBounds.minX) * mapScale}
                    y={(node.position.y - mapBounds.minY) * mapScale}
                    width={192 * mapScale} height={80 * mapScale}
                    rx={4 * mapScale}
                    fill={node.id === runHighlight ? '#10b981' : node.id === selectedId ? '#8b5cf6' : '#374151'}
                    stroke={node.id === selectedId ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}
                    strokeWidth={1}
                  />
                ))}
              </svg>
            </div>
          )}

          {/* Run Log Panel */}
          {showRunPanel && (
            <div className="absolute top-2 right-4 w-80 max-h-72 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  {running && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  Test Execution
                </span>
                <button onClick={() => setShowRunPanel(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>
              <div className="p-3 overflow-y-auto max-h-56 font-mono text-xs space-y-0.5">
                {runLog.map((line, i) => (
                  <div key={i} className={line.startsWith('  ✓') ? 'text-emerald-400' : line.startsWith('✅') ? 'text-emerald-300 font-semibold mt-2' : line.startsWith('▶') ? 'text-gray-300' : 'text-gray-500'}>{line}</div>
                ))}
                {running && <div className="text-gray-500 animate-pulse">...</div>}
              </div>
            </div>
          )}
        </div>
      </div>
      {showPreview && (
        <PreviewPanel nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} />
      )}
      {selectedNode && !showPreview && (
        <ConfigPanel
          node={selectedNode}
          onUpdate={handleUpdateConfig}
          onDelete={handleDeleteNode}
          onClose={() => setSelectedId(null)}
        />
      )}
      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowExport(false)}>
          <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold text-white">Export Agent</h2>
                <p className="text-xs text-gray-500 mt-0.5">{projectName} · {nodes.length} nodes</p>
              </div>
              <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            {/* File tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto px-4">
              {Object.keys(exportFiles).map(name => {
                const isJson = name === 'config.json' || name === 'skill.json'
                const isLocked = !isPro && !isJson
                return (
                  <button key={name} onClick={() => isLocked ? null : setExportTab(name)}
                    className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition border-b-2 flex items-center gap-1 ${isLocked ? 'text-gray-600 border-transparent cursor-not-allowed' : exportTab === name ? 'text-purple-400 border-purple-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                  >
                    {isLocked && <Lock className="w-3 h-3" />}
                    {name}
                  </button>
                )
              })}
            </div>
            {!isPro && !user && (
              <div className="mx-4 mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <span className="text-xs text-blue-300">💡 Sign up free to save projects and unlock all export formats.</span>
                <Link href="/auth/login" className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition whitespace-nowrap ml-3">Sign Up</Link>
              </div>
            )}
            {!isPro && user && (
              <div className="mx-4 mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <span className="text-xs text-purple-300">Free plan: JSON export only. Upgrade for Python, Docker & OpenClaw exports.</span>
                <Link href="/pricing" className="text-xs px-3 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition whitespace-nowrap ml-3">Upgrade</Link>
              </div>
            )}
            <div className="relative">
              <button onClick={() => {
                navigator.clipboard.writeText(exportFiles[exportTab] || '')
                setCopiedFile(exportTab)
                setTimeout(() => setCopiedFile(''), 2000)
              }} className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:text-white transition z-10 border border-white/10">
                {copiedFile === exportTab ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
              <pre className="p-4 overflow-auto max-h-[50vh] text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">{exportFiles[exportTab]}</pre>
            </div>
            {/* Deploy Guide */}
            <div className="mx-6 mt-3 mb-1 p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Deploy Your Agent</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-purple-400 font-medium mb-1">🐳 Docker</p>
                  <code className="text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded text-[10px] block">docker-compose up -d</code>
                </div>
                <div>
                  <p className="text-blue-400 font-medium mb-1">🐍 Python</p>
                  <code className="text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded text-[10px] block">pip install -r requirements.txt && python agent.py</code>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium mb-1">▲ Vercel</p>
                  <a href={`https://vercel.com/new?utm_source=agentforge`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Deploy to Vercel →</a>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
              <p className="text-xs text-gray-500">{Object.keys(exportFiles).length} files generated</p>
              <div className="flex gap-2">
                {Object.entries(exportFiles).map(([name, content]) => (
                  <button key={name} onClick={() => {
                    const blob = new Blob([content], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = name; a.click()
                    URL.revokeObjectURL(url)
                  }} className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 transition border border-white/10">
                    {name}
                  </button>
                ))}
                <button onClick={async () => {
                  const zip = new JSZip()
                  Object.entries(exportFiles).forEach(([name, content]) => zip.file(name, content))
                  zip.file('requirements.txt', 'openai>=1.0\naiohttp>=3.9\npython-dotenv>=1.0\n')
                  zip.file('.env.example', '# Add your API keys here\nOPENAI_API_KEY=\nAGENT_NAME=' + projectName + '\n')
                  zip.file('README.md', `# ${projectName}\n\nGenerated by [AgentForge](https://agent-builder-gamma.vercel.app)\n\n## Quick Start\n\n\`\`\`bash\npip install -r requirements.txt\ncp .env.example .env\n# Add your API keys to .env\npython agent.py\n\`\`\`\n\n## Docker\n\n\`\`\`bash\ndocker-compose up -d\n\`\`\`\n`)
                  const blob = await zip.generateAsync({ type: 'blob' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-agent.zip`; a.click()
                  URL.revokeObjectURL(url)
                }} className="px-4 py-1.5 rounded-lg text-sm text-white font-medium flex items-center gap-1.5" style={{ background: '#8b5cf6' }}>
                  <Download className="w-3.5 h-3.5" /> Download .zip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
