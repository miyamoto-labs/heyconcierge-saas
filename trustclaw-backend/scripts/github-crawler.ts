#!/usr/bin/env tsx

/**
 * GitHub Skill Crawler for TrustClaw
 * 
 * Searches GitHub for OpenClaw/Clawd skills and adds them to our database for review.
 * 
 * Usage:
 *   tsx scripts/github-crawler.ts [--dry-run] [--limit=50]
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ljseawnwxbkrejwysrey.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqc2Vhd253eGJrcmVqd3lzcmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NTg4MzAsImV4cCI6MjA1NDUzNDgzMH0.gT6q1qUAhdtMvKSA1k1PV_3hPSXuGhg0dJJujZ0ulb0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface GitHubSearchResult {
  total_count: number
  items: {
    name: string
    full_name: string
    html_url: string
    description: string | null
    owner: {
      login: string
      html_url: string
    }
    stargazers_count: number
    updated_at: string
    default_branch: string
  }[]
}

interface SkillMetadata {
  name: string
  description: string | null
  repo_url: string
  author: string
  author_url: string
  stars: number
  last_updated: string
  raw_skill_url: string
}

// ── Configuration ──
const SEARCH_QUERIES = [
  'SKILL.md openclaw in:path',
  'SKILL.md clawd in:path',
  'filename:SKILL.md openclaw',
  'filename:SKILL.md clawd',
]

const GITHUB_API = 'https://api.github.com'
const RATE_LIMIT_DELAY = 2000 // 2 seconds between requests (GitHub unauthenticated rate limit: 10 req/min)

// ── Parse CLI Args ──
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const maxResults = limitArg ? parseInt(limitArg.split('=')[1]) : 50

console.log('🔍 TrustClaw GitHub Skill Crawler')
console.log(`   Dry run: ${dryRun}`)
console.log(`   Max results per query: ${maxResults}`)
console.log('')

// ── GitHub API Helper ──
async function searchGitHub(query: string, page = 1, perPage = 30): Promise<GitHubSearchResult> {
  const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'TrustClaw-Crawler/1.0',
    },
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub rate limit exceeded. Wait or add GITHUB_TOKEN env var.')
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data as GitHubSearchResult
}

// ── Extract Skill Metadata ──
async function extractSkillMetadata(repo: GitHubSearchResult['items'][0]): Promise<SkillMetadata | null> {
  try {
    // Construct raw SKILL.md URL
    const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/SKILL.md`
    
    // Try to fetch SKILL.md to validate it exists
    const response = await fetch(rawUrl)
    if (!response.ok) {
      console.warn(`   ⚠️  SKILL.md not found at ${rawUrl}`)
      return null
    }

    const skillContent = await response.text()
    
    // Extract name from SKILL.md (first # heading)
    const nameMatch = skillContent.match(/^#\s+(.+)$/m)
    const skillName = nameMatch?.[1]?.trim() || repo.name

    return {
      name: skillName,
      description: repo.description || `OpenClaw skill from ${repo.owner.login}`,
      repo_url: repo.html_url,
      author: repo.owner.login,
      author_url: repo.owner.html_url,
      stars: repo.stargazers_count,
      last_updated: repo.updated_at,
      raw_skill_url: rawUrl,
    }
  } catch (error) {
    console.error(`   ❌ Failed to extract metadata: ${error}`)
    return null
  }
}

// ── Check if Skill Already Exists ──
async function skillExists(repoUrl: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('skills')
    .select('id')
    .eq('repo_url', repoUrl)
    .single()

  return !!data && !error
}

// ── Add Skill to Database ──
async function addSkill(skill: SkillMetadata): Promise<boolean> {
  const { error } = await supabase
    .from('skills')
    .insert({
      name: skill.name,
      description: skill.description,
      repo_url: skill.repo_url,
      author: skill.author,
      author_url: skill.author_url,
      stars: skill.stars,
      status: 'pending', // Needs manual review
      discovered_at: new Date().toISOString(),
      metadata: {
        last_updated: skill.last_updated,
        raw_skill_url: skill.raw_skill_url,
        source: 'github_crawler',
      },
    })

  if (error) {
    console.error(`   ❌ Database error: ${error.message}`)
    return false
  }

  return true
}

// ── Main Crawler ──
async function crawl() {
  const allSkills = new Map<string, SkillMetadata>()
  let totalFound = 0
  let totalAdded = 0
  let totalSkipped = 0

  for (const query of SEARCH_QUERIES) {
    console.log(`\n📝 Searching: "${query}"`)
    
    try {
      // GitHub search returns max 1000 results, we'll fetch first page only to respect rate limits
      const results = await searchGitHub(query, 1, Math.min(maxResults, 100))
      console.log(`   Found ${results.total_count} total results (fetching up to ${Math.min(maxResults, results.items.length)})`)

      for (const repo of results.items.slice(0, maxResults)) {
        // Deduplicate by repo URL
        if (allSkills.has(repo.html_url)) {
          continue
        }

        console.log(`\n   🔎 ${repo.full_name}`)
        
        const metadata = await extractSkillMetadata(repo)
        if (!metadata) {
          continue
        }

        totalFound++
        allSkills.set(repo.html_url, metadata)

        // Check if already in database
        const exists = await skillExists(metadata.repo_url)
        
        if (exists) {
          console.log(`   ⏭️  Already in database`)
          totalSkipped++
          continue
        }

        // Add to database
        if (dryRun) {
          console.log(`   [DRY RUN] Would add: ${metadata.name}`)
          console.log(`      Author: ${metadata.author} | Stars: ${metadata.stars}`)
        } else {
          const added = await addSkill(metadata)
          if (added) {
            console.log(`   ✅ Added to database (status: pending)`)
            totalAdded++
          }
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
      }

      // Delay between queries
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
    } catch (error) {
      console.error(`\n❌ Query failed: ${error}`)
    }
  }

  // ── Summary ──
  console.log('\n' + '═'.repeat(60))
  console.log('📊 Crawl Summary')
  console.log('═'.repeat(60))
  console.log(`   Total skills found: ${totalFound}`)
  console.log(`   Already in database: ${totalSkipped}`)
  console.log(`   Newly added: ${totalAdded}`)
  console.log(`   Status: ${dryRun ? 'DRY RUN (nothing saved)' : 'COMPLETE'}`)
  console.log('')
}

// ── Run ──
crawl().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
