'use client'
import { COMPONENTS, CATEGORY_LABELS, ComponentCategory, ComponentDef } from '@/lib/types'
import { useState } from 'react'

interface Props {
  onDragStart: (comp: ComponentDef) => void
}

export function ComponentSidebar({ onDragStart }: Props) {
  const [search, setSearch] = useState('')
  const [expandedCat, setExpandedCat] = useState<ComponentCategory | null>('triggers')
  const categories = Object.keys(CATEGORY_LABELS) as ComponentCategory[]

  const filtered = search
    ? COMPONENTS.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : COMPONENTS

  return (
    <div className="w-60 bg-gray-900 border-r border-white/10 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-white/10">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {categories.map(cat => {
          const items = filtered.filter(c => c.category === cat)
          if (items.length === 0) return null
          const isExpanded = search || expandedCat === cat
          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition rounded"
              >
                {CATEGORY_LABELS[cat]}
                <span className="text-[10px]">{isExpanded ? '▼' : '▶'}</span>
              </button>
              {isExpanded && (
                <div className="space-y-1">
                  {items.map(comp => (
                    <div
                      key={comp.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('component', JSON.stringify(comp))
                        onDragStart(comp)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/5 transition group"
                    >
                      <span className="text-lg">{comp.icon}</span>
                      <span className="text-sm text-gray-300 group-hover:text-white">{comp.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
