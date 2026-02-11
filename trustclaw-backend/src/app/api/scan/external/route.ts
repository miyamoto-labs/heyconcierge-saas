import { NextRequest, NextResponse } from 'next/server'
import { scanFromGitUrl, scanSkillPackage, checkVirusTotal, type ScanOutput } from '@/lib/scanner'

export const maxDuration = 60

// POST /api/scan/external — Paid external scanning endpoint ($0.10 per scan)
export async function POST(request: NextRequest) {
  try {
    // ── Authentication & Billing ──
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Include X-API-Key header or Authorization: Bearer <key>' },
        { status: 401 }
      )
    }

    // TODO: Validate API key against database & check credit balance
    // For now, we'll log the request but allow it through
    console.log('[External Scan] API Key:', apiKey.substring(0, 8) + '...')

    // ── Parse Request ──
    const contentType = request.headers.get('content-type') || ''
    let scanResult: ScanOutput
    let sourceType = 'unknown'
    let sourceIdentifier = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { url, code, filename } = body as {
        url?: string
        code?: string
        filename?: string
      }

      if (url) {
        sourceType = 'url'
        sourceIdentifier = url
        scanResult = await scanFromGitUrl(url)
        const vtFindings = await checkVirusTotal(url)
        scanResult.findings.push(...vtFindings)
      } else if (code) {
        sourceType = 'code'
        sourceIdentifier = filename || 'inline-code'
        const files = [{ name: filename || 'skill.js', content: code }]
        scanResult = await scanSkillPackage(files)
      } else {
        return NextResponse.json(
          { 
            error: 'Invalid request body',
            message: 'Provide either "url" (GitHub repo) or "code" (raw skill source)',
            cost: '$0.00'
          },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { 
          error: 'Unsupported Content-Type',
          message: 'Use application/json with "url" or "code" field',
          cost: '$0.00'
        },
        { status: 415 }
      )
    }

    // ── Billing Logic ──
    const scanCost = 0.10
    // TODO: Deduct $0.10 from API key balance in database
    // TODO: Log transaction to billing table
    console.log(`[Billing] Charged $${scanCost} to API key ${apiKey.substring(0, 8)}... for ${sourceType}: ${sourceIdentifier}`)

    // ── Return Results ──
    const scannedAt = new Date().toISOString()
    
    return NextResponse.json({
      result: scanResult.result,
      findings: scanResult.findings.map(f => ({
        severity: f.severity,
        category: f.category,
        message: f.message,
        line: f.line,
        file: f.file,
        recommendation: `Review ${f.category} issue in ${f.file || 'source'}`,
      })),
      score: scanResult.score,
      summary: scanResult.summary,
      scanned_at: scannedAt,
      cost: `$${scanCost.toFixed(2)}`,
      source: {
        type: sourceType,
        identifier: sourceIdentifier,
      },
    })
  } catch (error) {
    console.error('[External Scan] Error:', error)
    return NextResponse.json(
      { 
        error: 'Scan failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        cost: '$0.00'
      },
      { status: 500 }
    )
  }
}

// GET /api/scan/external — API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/scan/external',
    description: 'Paid security scanning service for OpenClaw/Clawd skills',
    pricing: {
      cost_per_scan: '$0.10',
      currency: 'USD',
      payment_method: 'API key with prepaid credits',
    },
    authentication: {
      header: 'X-API-Key',
      alternative: 'Authorization: Bearer <api-key>',
      note: 'Get your API key at https://trustclaw.xyz/account',
    },
    request: {
      method: 'POST',
      content_type: 'application/json',
      body_option_1: {
        url: 'https://github.com/username/openclaw-skill',
        description: 'Scan a skill from GitHub repository',
      },
      body_option_2: {
        code: 'export async function execute() { ... }',
        filename: 'skill.js',
        description: 'Scan raw skill code directly',
      },
    },
    response: {
      result: 'pass | warn | fail',
      findings: [
        {
          severity: 'critical | high | medium | low',
          category: 'security | privacy | reliability',
          message: 'Description of the issue',
          line: 42,
          file: 'skill.js',
          recommendation: 'How to fix it',
        },
      ],
      score: 85,
      summary: 'Overall assessment summary',
      scanned_at: '2026-02-07T22:55:00.000Z',
      cost: '$0.10',
      source: {
        type: 'url | code',
        identifier: 'github.com/... or filename',
      },
    },
    example_curl: `curl -X POST https://trustclaw.xyz/api/scan/external \\
  -H "X-API-Key: your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://github.com/openclaw/example-skill"}'`,
  })
}
