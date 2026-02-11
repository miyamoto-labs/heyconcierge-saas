'use client'
import { NodeData, EdgeData } from '@/lib/types'

interface Props {
  edges: EdgeData[]
  nodes: NodeData[]
  highlightNode?: string | null
}

export function ConnectionLines({ edges, nodes, highlightNode }: Props) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, overflow: 'visible' }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" opacity="0.6" />
        </marker>
        <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" opacity="0.9" />
        </marker>
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="edge-active-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {edges.map(edge => {
        const source = nodeMap.get(edge.source)
        const target = nodeMap.get(edge.target)
        if (!source || !target) return null

        const sx = source.position.x + 96
        const sy = source.position.y + 80
        const tx = target.position.x + 96
        const ty = target.position.y - 2

        const midY = (sy + ty) / 2
        const d = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`

        const isActive = highlightNode === edge.source || highlightNode === edge.target

        return (
          <g key={edge.id}>
            {/* Glow effect for active */}
            {isActive && (
              <path d={d} fill="none" stroke="#10b981" strokeWidth="6" strokeOpacity="0.15" />
            )}
            <path
              d={d}
              fill="none"
              stroke={isActive ? 'url(#edge-active-gradient)' : 'url(#edge-gradient)'}
              strokeWidth={isActive ? 2.5 : 2}
              markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
              className={isActive ? 'transition-all duration-300' : ''}
            />
          </g>
        )
      })}
    </svg>
  )
}
