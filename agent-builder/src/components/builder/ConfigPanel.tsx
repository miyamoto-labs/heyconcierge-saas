'use client'
import { NodeData, COMPONENTS } from '@/lib/types'
import { X, Trash2 } from 'lucide-react'

interface Props {
  node: NodeData | null
  onUpdate: (id: string, config: Record<string, any>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function ConfigPanel({ node, onUpdate, onDelete, onClose }: Props) {
  if (!node) return null
  const compDef = COMPONENTS.find(c => c.type === node.type)
  if (!compDef) return null

  return (
    <div className="w-80 bg-gray-900 border-l border-white/10 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">{node.icon}</span>
          <span className="font-medium text-white">{node.label}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition"><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {compDef.configFields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-gray-400 mb-1">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                value={node.config[field.key] || field.default || ''}
                onChange={e => onUpdate(node.id, { ...node.config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            ) : field.type === 'select' ? (
              <select
                value={node.config[field.key] || field.default || ''}
                onChange={e => onUpdate(node.id, { ...node.config, [field.key]: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select...</option>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === 'number' ? (
              <input
                type="number"
                value={node.config[field.key] ?? field.default ?? ''}
                onChange={e => onUpdate(node.id, { ...node.config, [field.key]: parseFloat(e.target.value) || 0 })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            ) : field.type === 'toggle' ? (
              <button
                onClick={() => onUpdate(node.id, { ...node.config, [field.key]: !node.config[field.key] })}
                className={`w-10 h-6 rounded-full transition ${node.config[field.key] ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition transform ${node.config[field.key] ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            ) : (
              <input
                type="text"
                value={node.config[field.key] || field.default || ''}
                onChange={e => onUpdate(node.id, { ...node.config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            )}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/10">
        <button onClick={() => onDelete(node.id)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition">
          <Trash2 className="w-4 h-4" /> Delete Node
        </button>
      </div>
    </div>
  )
}
