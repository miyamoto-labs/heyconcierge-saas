import { NextRequest, NextResponse } from 'next/server'
import { scanFromGitUrl, scanSkillPackage, checkVirusTotal, type ScanOutput } from '@/lib/scanner'

export const maxDuration = 60

// POST /api/scan — accepts GitHub URL or file upload
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let scanResult: ScanOutput

    if (contentType.includes('multipart/form-data')) {
      // ── File Upload ──
      const formData = await request.formData()
      const uploadedFiles = formData.getAll('files') as File[]
      const gitUrl = formData.get('url') as string | null

      if (gitUrl) {
        scanResult = await scanFromGitUrl(gitUrl)
        // Optional VirusTotal check
        const vtFindings = await checkVirusTotal(gitUrl)
        scanResult.findings.push(...vtFindings)
      } else if (uploadedFiles.length > 0) {
        const files: { name: string; content: string }[] = []
        for (const file of uploadedFiles) {
          if (file.size > 500_000) continue // skip large files
          const content = await file.text()
          files.push({ name: file.name, content })
        }
        if (files.length === 0) {
          return NextResponse.json({ error: 'No valid files to scan' }, { status: 400 })
        }
        scanResult = await scanSkillPackage(files)
      } else {
        return NextResponse.json({ error: 'Provide a GitHub URL or upload files' }, { status: 400 })
      }
    } else {
      // ── JSON body ──
      const body = await request.json()
      const { url, code, filename } = body as {
        url?: string
        code?: string
        filename?: string
      }

      if (url) {
        scanResult = await scanFromGitUrl(url)
        const vtFindings = await checkVirusTotal(url)
        scanResult.findings.push(...vtFindings)
      } else if (code) {
        const files = [{ name: filename || 'uploaded.js', content: code }]
        scanResult = await scanSkillPackage(files)
      } else {
        return NextResponse.json(
          { error: 'Provide "url" (GitHub repo) or "code" (raw source) in request body' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      passed: scanResult.result === 'pass',
      result: scanResult.result,
      score: scanResult.score,
      summary: scanResult.summary,
      findings: {
        critical: scanResult.findings.filter(f => f.severity === 'critical'),
        warnings: scanResult.findings.filter(f => f.severity === 'high' || f.severity === 'medium'),
        info: scanResult.findings.filter(f => f.severity === 'low'),
      },
      totalFindings: scanResult.findings.length,
    })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Scan failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
