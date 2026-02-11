'use client'

import Link from 'next/link'
import { Shield, Download, User, CheckCircle } from 'lucide-react'
import type { Skill } from '@/types/database'

export default function SkillCard({ skill }: { skill: Skill }) {
  const scanColor = skill.scan_result === 'pass' 
    ? 'text-trust-green border-trust-green/30 bg-trust-green/10'
    : skill.scan_result === 'warn'
    ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
    : skill.scan_result === 'fail'
    ? 'text-red-400 border-red-400/30 bg-red-400/10'
    : 'text-dark-muted border-dark-border bg-dark-bg'

  return (
    <Link href={`/skills/${skill.id}`}>
      <div className="card hover:border-trust-green/50 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-trust-green/10 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-trust-green" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{skill.name}</h3>
              <div className="flex items-center gap-1 text-xs text-dark-muted">
                <User className="h-3 w-3" />
                <span>{skill.publisher?.display_name || 'Unknown'}</span>
                {skill.publisher?.verified && (
                  <CheckCircle className="h-3 w-3 text-trust-green" />
                )}
              </div>
            </div>
          </div>
          {skill.scan_result && (
            <span className={`text-xs px-2 py-1 rounded-full border ${scanColor} font-medium`}>
              {skill.scan_result === 'pass' ? '✓ Safe' : skill.scan_result === 'warn' ? '⚠ Warn' : '✗ Fail'}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-dark-muted text-sm mb-4 flex-1 line-clamp-2">
          {skill.description || 'No description provided.'}
        </p>

        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {skill.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs bg-dark-bg px-2 py-0.5 rounded-full text-dark-muted border border-dark-border">
                {tag}
              </span>
            ))}
            {skill.tags.length > 3 && (
              <span className="text-xs text-dark-muted">+{skill.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-border text-xs text-dark-muted">
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{skill.downloads.toLocaleString()}</span>
          </div>
          <span className="capitalize">{skill.category || 'General'}</span>
          <span>v{skill.version}</span>
        </div>
      </div>
    </Link>
  )
}
