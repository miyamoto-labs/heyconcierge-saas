'use client'
import { NodeData, COMPONENTS } from '@/lib/types'
import { useRef } from 'react'

interface Props {
  node: NodeData
  selected: boolean
  highlighted?: boolean
  onSelect: () => void
  onMove: (id: string, x: number, y: number) => void
  onMoveEnd?: () => void
  onStartConnect: (id: string) => void
  onEndConnect: (id: string) => void
  scale: number
}

export function ComponentNode({ node, selected, highlighted, onSelect, onMove, onMoveEnd, onStartConnect, onEndConnect, scale }: Props) {
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null)
  const compDef = COMPONENTS.find(c => c.type === node.type)
  const color = compDef?.color || '#8b5cf6'

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.port) return
    e.stopPropagation()
    onSelect()
    dragRef.current = { startX: e.clientX, startY: e.clientY, nodeX: node.position.x, nodeY: node.position.y }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = (e.clientX - dragRef.current.startX) / scale
      const dy = (e.clientY - dragRef.current.startY) / scale
      onMove(node.id, dragRef.current.nodeX + dx, dragRef.current.nodeY + dy)
    }
    const handleMouseUp = () => {
      dragRef.current = null
      onMoveEnd?.()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      className="absolute select-none group"
      style={{ left: node.position.x, top: node.position.y, zIndex: selected ? 10 : 1 }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`w-48 rounded-xl border-2 shadow-lg transition-all duration-200 cursor-move ${selected ? 'shadow-purple-500/30 scale-[1.02]' : 'shadow-black/20 hover:shadow-purple-500/10'} ${highlighted ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-950 shadow-emerald-500/30' : ''}`}
        style={{
          borderColor: highlighted ? '#10b981' : selected ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
          background: highlighted ? 'rgba(16,185,129,0.08)' : 'rgba(17,17,27,0.95)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl" style={{ background: highlighted ? 'rgba(16,185,129,0.15)' : `${color}20` }}>
          <span className="text-lg">{node.icon}</span>
          <span className="text-sm font-medium text-white truncate">{node.label}</span>
          {highlighted && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
        </div>
        {/* Config preview */}
        <div className="px-3 py-2 text-xs text-gray-500 min-h-[32px]">
          {Object.entries(node.config).filter(([,v]) => v).slice(0, 2).map(([k, v]) => (
            <div key={k} className="truncate">{k}: <span className="text-gray-400">{String(v).slice(0, 25)}</span></div>
          ))}
          {Object.keys(node.config).filter(k => node.config[k]).length === 0 && <div className="italic text-gray-600">Click to configure</div>}
        </div>
        {/* Input port (top) */}
        <div
          data-port="in"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 bg-gray-900 cursor-crosshair hover:bg-purple-500 hover:scale-125 transition-all flex items-center justify-center"
          style={{ borderColor: color }}
          onMouseUp={(e) => { e.stopPropagation(); onEndConnect(node.id) }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 transition" />
        </div>
        {/* Output port (bottom) */}
        <div
          data-port="out"
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 bg-gray-900 cursor-crosshair hover:bg-purple-500 hover:scale-125 transition-all flex items-center justify-center"
          style={{ borderColor: color }}
          onMouseDown={(e) => { e.stopPropagation(); onStartConnect(node.id) }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 transition" />
        </div>
      </div>
    </div>
  )
}
