import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scanFromGitUrl, type ScanOutput } from '@/lib/scanner'

// POST /api/skills/[id]/scan - Trigger security scan for a skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: skill, error } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    await supabaseAdmin.from('skills').update({ status: 'scanning' }).eq('id', id)

    let scanResult: ScanOutput
    if (skill.git_url) {
      scanResult = await scanFromGitUrl(skill.git_url)
    } else if (skill.package_url) {
      scanResult = {
        result: 'warn', score: 50,
        summary: { filesScanned: 0, critical: 0, high: 0, medium: 1, low: 0 },
        findings: [{
          type: 'warning', category: 'manual_review',
          message: 'Package URL scanning requires manual review', severity: 'medium',
        }],
      }
    } else {
      scanResult = {
        result: 'fail', score: 0,
        summary: { filesScanned: 0, critical: 1, high: 0, medium: 0, low: 0 },
        findings: [{
          type: 'error', category: 'no_source',
          message: 'No source URL provided for scanning', severity: 'critical',
        }],
      }
    }

    const { data: scan, error: scanError } = await supabaseAdmin
      .from('scans')
      .insert({
        skill_id: id,
        result: scanResult.result,
        findings: scanResult.findings,
      })
      .select()
      .single()

    if (scanError) {
      console.error('Error saving scan:', scanError)
      return NextResponse.json({ error: 'Failed to save scan results' }, { status: 500 })
    }

    await supabaseAdmin.from('skills').update({
      status: 'pending',
      scan_result: scanResult.result,
    }).eq('id', id)

    return NextResponse.json({
      message: 'Scan completed',
      scan,
      score: scanResult.score,
      summary: scanResult.summary,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
