import type { ScanResult, ScanFinding } from '@/types/database'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScanOutput {
  result: ScanResult
  findings: ScanFinding[]
  score: number // 0-100 safety score
  summary: {
    filesScanned: number
    critical: number
    high: number
    medium: number
    low: number
  }
}

interface PatternRule {
  pattern: RegExp
  category: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  /** Context lines around match for better reporting */
  contextual?: boolean
  /** If true, only flag when NOT in a comment */
  skipComments?: boolean
}

// ─── Pattern Database ────────────────────────────────────────────────────────

const PATTERN_RULES: PatternRule[] = [
  // ── Shell Execution (Critical/High) ──
  { pattern: /\bchild_process\b/, category: 'shell_execution', message: 'Imports child_process module', severity: 'critical', skipComments: true },
  { pattern: /\brequire\s*\(\s*['"`]child_process['"`]\s*\)/, category: 'shell_execution', message: 'Requires child_process', severity: 'critical', skipComments: true },
  { pattern: /\bexecSync\s*\(/, category: 'shell_execution', message: 'Synchronous shell execution (execSync)', severity: 'critical', skipComments: true },
  { pattern: /\bspawnSync\s*\(/, category: 'shell_execution', message: 'Synchronous process spawn (spawnSync)', severity: 'critical', skipComments: true },
  { pattern: /\bexec\s*\(\s*['"`]/, category: 'shell_execution', message: 'Shell command execution via exec()', severity: 'critical', skipComments: true },
  { pattern: /\bspawn\s*\(\s*['"`]/, category: 'shell_execution', message: 'Process spawn', severity: 'high', skipComments: true },
  { pattern: /\bexecFile\s*\(/, category: 'shell_execution', message: 'File execution via execFile()', severity: 'high', skipComments: true },
  { pattern: /\bfork\s*\(\s*['"`]/, category: 'shell_execution', message: 'Process fork', severity: 'high', skipComments: true },
  { pattern: /\bos\.system\s*\(/, category: 'shell_execution', message: 'Python os.system() call', severity: 'critical', skipComments: true },
  { pattern: /\bos\.popen\s*\(/, category: 'shell_execution', message: 'Python os.popen() call', severity: 'critical', skipComments: true },
  { pattern: /\bsubprocess\.(run|call|Popen|check_output)\s*\(/, category: 'shell_execution', message: 'Python subprocess execution', severity: 'critical', skipComments: true },
  { pattern: /import\s+subprocess/, category: 'shell_execution', message: 'Python subprocess import', severity: 'high', skipComments: true },
  { pattern: /from\s+subprocess\s+import/, category: 'shell_execution', message: 'Python subprocess import', severity: 'high', skipComments: true },

  // ── Eval / Dynamic Code (Critical) ──
  { pattern: /\beval\s*\(/, category: 'code_injection', message: 'eval() - arbitrary code execution', severity: 'critical', skipComments: true },
  { pattern: /new\s+Function\s*\(/, category: 'code_injection', message: 'new Function() - dynamic code construction', severity: 'critical', skipComments: true },
  { pattern: /\bsetTimeout\s*\(\s*['"`]/, category: 'code_injection', message: 'setTimeout with string argument (implicit eval)', severity: 'high', skipComments: true },
  { pattern: /\bsetInterval\s*\(\s*['"`]/, category: 'code_injection', message: 'setInterval with string argument (implicit eval)', severity: 'high', skipComments: true },
  { pattern: /\bcompile\s*\(\s*['"`]/, category: 'code_injection', message: 'Python compile() - dynamic code compilation', severity: 'high', skipComments: true },
  { pattern: /\b__import__\s*\(/, category: 'code_injection', message: 'Python __import__() - dynamic import', severity: 'high', skipComments: true },

  // ── Credential Access (Critical) ──
  { pattern: /\.env\b(?!\.example|\.sample|\.template)/, category: 'credential_access', message: 'References .env file (may contain secrets)', severity: 'high' },
  { pattern: /\.ssh\//, category: 'credential_access', message: 'Accesses .ssh directory', severity: 'critical' },
  { pattern: /id_rsa|id_ed25519|id_ecdsa/, category: 'credential_access', message: 'References SSH private key file', severity: 'critical' },
  { pattern: /\.aws\/credentials/, category: 'credential_access', message: 'Accesses AWS credentials file', severity: 'critical' },
  { pattern: /\.aws\/config/, category: 'credential_access', message: 'Accesses AWS config', severity: 'high' },
  { pattern: /\.netrc/, category: 'credential_access', message: 'Accesses .netrc file (stored credentials)', severity: 'critical' },
  { pattern: /\.npmrc/, category: 'credential_access', message: 'Accesses .npmrc (may contain auth tokens)', severity: 'high' },
  { pattern: /\.docker\/config\.json/, category: 'credential_access', message: 'Accesses Docker config (may contain registry auth)', severity: 'critical' },
  { pattern: /\.kube\/config/, category: 'credential_access', message: 'Accesses Kubernetes config', severity: 'critical' },
  { pattern: /\.gnupg\//, category: 'credential_access', message: 'Accesses GPG keyring', severity: 'critical' },
  { pattern: /keychain|keyring/, category: 'credential_access', message: 'References system keychain/keyring', severity: 'high', skipComments: true },
  { pattern: /PRIVATE[_\s-]?KEY\s*[=:]/, category: 'credential_access', message: 'Hardcoded private key assignment', severity: 'critical' },
  { pattern: /SECRET[_\s-]?KEY\s*[=:]/, category: 'credential_access', message: 'Hardcoded secret key assignment', severity: 'critical' },
  { pattern: /API[_\s-]?KEY\s*[=:]\s*['"`][A-Za-z0-9]/, category: 'credential_access', message: 'Hardcoded API key', severity: 'critical' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/, category: 'credential_access', message: 'Hardcoded Bearer token', severity: 'critical' },
  { pattern: /password\s*[=:]\s*['"`][^'"`\s]{3,}/, category: 'credential_access', message: 'Possible hardcoded password', severity: 'high' },

  // ── Suspicious Network (High) ──
  { pattern: /\bcurl\s+/, category: 'network_suspicious', message: 'Shell curl command', severity: 'high', skipComments: true },
  { pattern: /\bwget\s+/, category: 'network_suspicious', message: 'Shell wget command', severity: 'high', skipComments: true },
  { pattern: /https?:\/\/[^\s'"`)]+\.(ru|cn|tk|ml|ga|cf|top|xyz|buzz|click)\b/, category: 'network_suspicious', message: 'URL with suspicious TLD (commonly used for phishing/malware)', severity: 'high' },
  { pattern: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, category: 'network_suspicious', message: 'Direct IP address connection (potential C2)', severity: 'high' },
  { pattern: /ngrok\.io|localtunnel\.me|serveo\.net/, category: 'network_suspicious', message: 'Tunnel service URL (data exfiltration risk)', severity: 'high' },
  { pattern: /pastebin\.com|hastebin\.com|paste\.ee/, category: 'network_suspicious', message: 'Paste service URL (payload hosting)', severity: 'medium' },
  { pattern: /discord\.com\/api\/webhooks\//, category: 'network_suspicious', message: 'Discord webhook (data exfiltration channel)', severity: 'high' },
  { pattern: /telegram\.org\/bot|api\.telegram\.org/, category: 'network_suspicious', message: 'Telegram bot API (data exfiltration channel)', severity: 'high' },

  // ── Crypto Mining (Critical) ──
  { pattern: /coinhive|coin-hive/, category: 'crypto_mining', message: 'CoinHive crypto miner detected', severity: 'critical' },
  { pattern: /\bxmrig\b/, category: 'crypto_mining', message: 'XMRig miner reference', severity: 'critical' },
  { pattern: /stratum\+tcp:\/\//, category: 'crypto_mining', message: 'Stratum mining protocol URL', severity: 'critical' },
  { pattern: /cryptonight|randomx/, category: 'crypto_mining', message: 'Mining algorithm reference', severity: 'critical' },
  { pattern: /miner\.(start|run|mine)\s*\(/, category: 'crypto_mining', message: 'Miner startup call', severity: 'critical', skipComments: true },

  // ── Obfuscation (Medium/High) ──
  { pattern: /\\x[0-9a-fA-F]{2}(?:\\x[0-9a-fA-F]{2}){3,}/, category: 'obfuscation', message: 'Hex-escaped string sequence (obfuscation)', severity: 'high' },
  { pattern: /\\u[0-9a-fA-F]{4}(?:\\u[0-9a-fA-F]{4}){3,}/, category: 'obfuscation', message: 'Unicode-escaped string sequence (obfuscation)', severity: 'medium' },
  { pattern: /\batob\s*\(/, category: 'obfuscation', message: 'Base64 decode (atob) - may hide payloads', severity: 'medium', skipComments: true },
  { pattern: /Buffer\.from\s*\([^)]+,\s*['"`]base64['"`]\s*\)/, category: 'obfuscation', message: 'Base64 Buffer decode', severity: 'medium', skipComments: true },
  { pattern: /fromCharCode/, category: 'obfuscation', message: 'String.fromCharCode (character-by-character string construction)', severity: 'medium', skipComments: true },
  { pattern: /_0x[a-f0-9]{4,}/, category: 'obfuscation', message: 'Obfuscated variable name (_0x pattern)', severity: 'high' },
  { pattern: /\bbase64\.(b64decode|decodebytes)\s*\(/, category: 'obfuscation', message: 'Python base64 decode', severity: 'medium', skipComments: true },
  { pattern: /import\s+base64/, category: 'obfuscation', message: 'Python base64 module import', severity: 'low', skipComments: true },

  // ── Filesystem Sensitive Paths (High) ──
  { pattern: /\/etc\/passwd/, category: 'filesystem_sensitive', message: 'Accesses /etc/passwd', severity: 'critical' },
  { pattern: /\/etc\/shadow/, category: 'filesystem_sensitive', message: 'Accesses /etc/shadow', severity: 'critical' },
  { pattern: /\/etc\/hosts/, category: 'filesystem_sensitive', message: 'Accesses /etc/hosts', severity: 'high' },
  { pattern: /\/proc\/self/, category: 'filesystem_sensitive', message: 'Accesses /proc/self (process info)', severity: 'high' },
  { pattern: /~\/\.bash_history|~\/\.zsh_history/, category: 'filesystem_sensitive', message: 'Accesses shell history', severity: 'critical' },
  { pattern: /~\/\.gitconfig/, category: 'filesystem_sensitive', message: 'Accesses git config', severity: 'medium' },
  { pattern: /\/tmp\/\./, category: 'filesystem_sensitive', message: 'Hidden file in /tmp (common malware staging)', severity: 'high' },

  // ── Filesystem Destructive Operations ──
  { pattern: /fs\.(unlink|rmdir|rm)Sync?\s*\(/, category: 'filesystem_destructive', message: 'File/directory deletion', severity: 'high', skipComments: true },
  { pattern: /rimraf|del-cli/, category: 'filesystem_destructive', message: 'Recursive deletion utility', severity: 'medium', skipComments: true },
  { pattern: /shutil\.rmtree/, category: 'filesystem_destructive', message: 'Python recursive directory deletion', severity: 'high', skipComments: true },
  { pattern: /os\.remove\s*\(|os\.unlink\s*\(/, category: 'filesystem_destructive', message: 'Python file deletion', severity: 'high', skipComments: true },

  // ── Network Server Creation ──
  { pattern: /net\.createServer/, category: 'network_server', message: 'TCP server creation', severity: 'medium', skipComments: true },
  { pattern: /dgram\.createSocket/, category: 'network_server', message: 'UDP socket creation', severity: 'medium', skipComments: true },
  { pattern: /\.listen\s*\(\s*\d{2,5}\s*[,)]/, category: 'network_server', message: 'Listening on a port', severity: 'medium', skipComments: true },
  { pattern: /http\.createServer/, category: 'network_server', message: 'HTTP server creation', severity: 'low', skipComments: true },

  // ── Environment Variable Exfiltration ──
  { pattern: /process\.env(?!\.)/, category: 'env_access', message: 'Accesses entire process.env object', severity: 'high', skipComments: true },
  { pattern: /JSON\.stringify\s*\(\s*process\.env\s*\)/, category: 'env_access', message: 'Serializes all environment variables (exfiltration)', severity: 'critical', skipComments: true },
  { pattern: /Object\.keys\s*\(\s*process\.env\s*\)/, category: 'env_access', message: 'Enumerates environment variable names', severity: 'high', skipComments: true },
  { pattern: /os\.environ(?!\[)/, category: 'env_access', message: 'Python: accesses entire environment', severity: 'high', skipComments: true },

  // ── Known Malicious Patterns ──
  { pattern: /reverse.{0,10}shell/i, category: 'malicious_known', message: 'Reverse shell pattern', severity: 'critical' },
  { pattern: /\bbindshell\b|bind.{0,5}shell/i, category: 'malicious_known', message: 'Bind shell pattern', severity: 'critical' },
  { pattern: /\bbackdoor\b/i, category: 'malicious_known', message: 'Backdoor reference', severity: 'critical' },
  { pattern: /\bkeylogger\b/i, category: 'malicious_known', message: 'Keylogger reference', severity: 'critical' },
  { pattern: /\bransomware\b/i, category: 'malicious_known', message: 'Ransomware reference', severity: 'critical' },
  { pattern: /\bexploit\b/i, category: 'malicious_known', message: 'Exploit reference', severity: 'medium' },
  { pattern: /\bpayload\b/i, category: 'malicious_known', message: 'Payload reference', severity: 'low' },

  // ── Data Exfiltration Patterns ──
  { pattern: /FormData.*append.*password/i, category: 'data_exfiltration', message: 'Password in FormData (exfiltration)', severity: 'critical', skipComments: true },
  { pattern: /fetch\s*\([^)]*\+\s*document\.cookie/, category: 'data_exfiltration', message: 'Cookie exfiltration via fetch', severity: 'critical', skipComments: true },
  { pattern: /document\.cookie/, category: 'data_exfiltration', message: 'Accesses document cookies', severity: 'medium', skipComments: true },
  { pattern: /localStorage\.getItem/, category: 'data_exfiltration', message: 'Reads localStorage', severity: 'low', skipComments: true },
]

// ─── Allowlisted Patterns (reduce false positives) ──────────────────────────

const ALLOWLIST_CONTEXTS: { pattern: RegExp; allowCategories: string[] }[] = [
  // Comments and documentation
  { pattern: /^\s*(\/\/|#|\/\*|\*|"""|''')\s*/, allowCategories: ['malicious_known', 'credential_access'] },
  // Test files
  { pattern: /\.(test|spec|__test__|_test)\.(ts|js|py)$/, allowCategories: ['shell_execution', 'credential_access'] },
  // README/docs
  { pattern: /\.(md|txt|rst)$/i, allowCategories: ['malicious_known', 'credential_access', 'shell_execution'] },
]

// ─── Scanner Engine ──────────────────────────────────────────────────────────

function isCommentLine(line: string, filename: string): boolean {
  const trimmed = line.trim()
  if (filename.match(/\.(js|ts|jsx|tsx)$/i)) {
    return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')
  }
  if (filename.match(/\.py$/i)) {
    return trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")
  }
  return false
}

function isAllowlisted(finding: ScanFinding, filename: string, line: string): boolean {
  for (const rule of ALLOWLIST_CONTEXTS) {
    if (rule.allowCategories.includes(finding.category)) {
      // Check if filename matches doc/test patterns
      if (rule.pattern.test(filename)) return true
      // Check if line is a comment
      if (rule.pattern.test(line)) return true
    }
  }
  return false
}

export async function scanCode(code: string, filename: string = 'unknown'): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = []
  const lines = code.split('\n')

  // Skip binary-looking files
  if (code.includes('\0')) return []

  // Skip known non-code files
  if (filename.match(/\.(md|txt|rst|json|yaml|yml|toml|xml|svg|css|html|lock)$/i)) {
    // Only scan these for hardcoded secrets, not code patterns
    const secretPatterns = PATTERN_RULES.filter(r =>
      r.category === 'credential_access' && r.severity === 'critical'
    )
    for (const rule of secretPatterns) {
      for (let i = 0; i < lines.length; i++) {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags)
        const match = regex.exec(lines[i])
        if (match) {
          const finding: ScanFinding = {
            type: rule.severity === 'critical' || rule.severity === 'high' ? 'error' : 'warning',
            category: rule.category,
            message: `${rule.message}: "${match[0].substring(0, 60)}${match[0].length > 60 ? '...' : ''}"`,
            file: filename,
            line: i + 1,
            severity: rule.severity,
          }
          if (!isAllowlisted(finding, filename, lines[i])) {
            findings.push(finding)
          }
        }
      }
    }
    return findings
  }

  for (const rule of PATTERN_RULES) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Skip comment lines if rule requests it
      if (rule.skipComments && isCommentLine(line, filename)) continue

      const regex = new RegExp(rule.pattern.source, rule.pattern.flags)
      const match = regex.exec(line)
      if (match) {
        const finding: ScanFinding = {
          type: rule.severity === 'critical' || rule.severity === 'high' ? 'error' : 'warning',
          category: rule.category,
          message: `${rule.message}: "${match[0].substring(0, 60)}${match[0].length > 60 ? '...' : ''}"`,
          file: filename,
          line: i + 1,
          severity: rule.severity,
        }
        if (!isAllowlisted(finding, filename, line)) {
          findings.push(finding)
        }
      }
    }
  }

  return findings
}

// ─── Minification / Obfuscation Heuristics ──────────────────────────────────

function checkMinification(files: { name: string; content: string }[]): ScanFinding[] {
  const findings: ScanFinding[] = []
  for (const file of files) {
    if (!file.name.match(/\.(js|ts)$/i)) continue
    if (file.name.includes('.min.')) {
      findings.push({
        type: 'warning', category: 'minification',
        message: 'Minified file detected - code review not possible',
        file: file.name, severity: 'high',
      })
      continue
    }
    const lines = file.content.split('\n')
    const longLines = lines.filter(l => l.length > 500)
    if (longLines.length > 0 && lines.length < 10 && file.content.length > 1000) {
      findings.push({
        type: 'warning', category: 'minification',
        message: 'File appears to be minified/bundled - manual review recommended',
        file: file.name, severity: 'high',
      })
    }
    // Entropy check: high ratio of unique chars suggests obfuscation
    if (file.content.length > 500) {
      const uniqueChars = new Set(file.content).size
      const ratio = uniqueChars / Math.min(file.content.length, 1000)
      if (ratio > 0.7) {
        findings.push({
          type: 'warning', category: 'obfuscation',
          message: `High character entropy (${(ratio * 100).toFixed(0)}%) - possible obfuscation`,
          file: file.name, severity: 'medium',
        })
      }
    }
  }
  return findings
}

// ─── Dependency Analysis ─────────────────────────────────────────────────────

const SUSPICIOUS_PACKAGES: Record<string, { severity: 'critical' | 'high' | 'medium'; reason: string }> = {
  'event-stream': { severity: 'critical', reason: 'Known compromised package (2018 supply chain attack)' },
  'flatmap-stream': { severity: 'critical', reason: 'Malicious package from event-stream incident' },
  'ua-parser-js': { severity: 'high', reason: 'Was compromised (crypto miner injection, Oct 2021)' },
  'coa': { severity: 'high', reason: 'Was compromised (Nov 2021)' },
  'rc': { severity: 'high', reason: 'Was compromised (Nov 2021)' },
  'colors': { severity: 'medium', reason: 'Sabotaged by maintainer (infinite loop, Jan 2022)' },
  'faker': { severity: 'medium', reason: 'Sabotaged by maintainer (Jan 2022)' },
  'node-ipc': { severity: 'critical', reason: 'Protestware - destructive payload (Mar 2022)' },
}

function checkDependencies(files: { name: string; content: string }[]): ScanFinding[] {
  const findings: ScanFinding[] = []
  const pkgJson = files.find(f => f.name === 'package.json' || f.name.endsWith('/package.json'))
  if (pkgJson) {
    try {
      const pkg = JSON.parse(pkgJson.content)
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const [name, ] of Object.entries(allDeps)) {
        if (SUSPICIOUS_PACKAGES[name]) {
          const info = SUSPICIOUS_PACKAGES[name]
          findings.push({
            type: info.severity === 'critical' ? 'error' : 'warning',
            category: 'suspicious_dependency',
            message: `Suspicious dependency "${name}": ${info.reason}`,
            file: pkgJson.name,
            severity: info.severity,
          })
        }
      }
    } catch { /* ignore parse errors */ }
  }

  const reqTxt = files.find(f => f.name === 'requirements.txt' || f.name.endsWith('/requirements.txt'))
  if (reqTxt) {
    const pipSuspicious = ['colourama', 'python-dateutil-2'] // typosquat examples
    for (const line of reqTxt.content.split('\n')) {
      const pkg = line.trim().split(/[=<>!]/)[0].trim()
      if (pipSuspicious.includes(pkg)) {
        findings.push({
          type: 'error', category: 'suspicious_dependency',
          message: `Suspected typosquat package: "${pkg}"`,
          file: reqTxt.name, severity: 'critical',
        })
      }
    }
  }

  return findings
}

// ─── Score Calculation ───────────────────────────────────────────────────────

function calculateScore(findings: ScanFinding[]): number {
  let score = 100
  const deductions: Record<string, number> = {
    critical: 25,
    high: 10,
    medium: 3,
    low: 1,
  }
  // Deduplicate by category+severity to avoid over-penalizing repeated patterns
  const seen = new Set<string>()
  for (const f of findings) {
    const key = `${f.category}:${f.severity}`
    if (!seen.has(key)) {
      score -= deductions[f.severity] || 1
      seen.add(key)
    } else {
      // Additional instances penalize less
      score -= Math.ceil(deductions[f.severity] / 3)
    }
  }
  return Math.max(0, Math.min(100, score))
}

// ─── Main Package Scanner ────────────────────────────────────────────────────

export async function scanSkillPackage(files: { name: string; content: string }[]): Promise<ScanOutput> {
  const allFindings: ScanFinding[] = []

  // Scan each file
  for (const file of files) {
    if (file.name.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz|bmp|mp3|mp4)$/i)) continue
    if (file.content.length > 500_000) {
      allFindings.push({
        type: 'warning', category: 'large_file',
        message: 'File exceeds 500KB - skipped (may hide malicious code)',
        file: file.name, severity: 'medium',
      })
      continue
    }
    const findings = await scanCode(file.content, file.name)
    allFindings.push(...findings)
  }

  // Minification checks
  allFindings.push(...checkMinification(files))

  // Dependency checks
  allFindings.push(...checkDependencies(files))

  // Calculate score and summary
  const score = calculateScore(allFindings)
  const summary = {
    filesScanned: files.filter(f => !f.name.match(/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz)$/i)).length,
    critical: allFindings.filter(f => f.severity === 'critical').length,
    high: allFindings.filter(f => f.severity === 'high').length,
    medium: allFindings.filter(f => f.severity === 'medium').length,
    low: allFindings.filter(f => f.severity === 'low').length,
  }

  let result: ScanResult
  if (summary.critical > 0) result = 'fail'
  else if (summary.high > 0) result = 'fail'
  else if (summary.medium > 0) result = 'warn'
  else result = 'pass'

  return { result, findings: allFindings, score, summary }
}

// ─── GitHub Repository Scanner ───────────────────────────────────────────────

async function fetchGithubTree(owner: string, repo: string, branch: string = 'main'): Promise<{ name: string; content: string }[]> {
  const files: { name: string; content: string }[] = []

  // Try to get the tree recursively
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'TrustClaw-Scanner/2.0' } }
  )

  if (!treeRes.ok) {
    // Try 'master' branch
    if (branch === 'main') return fetchGithubTree(owner, repo, 'master')
    throw new Error(`GitHub API error: ${treeRes.status}`)
  }

  const tree = await treeRes.json()
  const codeFiles = tree.tree.filter((item: { type: string; path: string; size?: number }) =>
    item.type === 'blob' &&
    (item.size || 0) < 200_000 &&
    item.path.match(/\.(js|ts|jsx|tsx|py|sh|bash|json|yaml|yml|toml|cfg|ini|mjs|cjs)$/i)
  ).slice(0, 100) // Cap at 100 files

  // Fetch files in parallel (batched)
  const batchSize = 10
  for (let i = 0; i < codeFiles.length; i += batchSize) {
    const batch = codeFiles.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (item: { path: string }) => {
        try {
          const res = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`,
            { headers: { 'User-Agent': 'TrustClaw-Scanner/2.0' } }
          )
          if (res.ok) {
            const content = await res.text()
            return { name: item.path, content }
          }
        } catch { /* skip */ }
        return null
      })
    )
    for (const r of results) {
      if (r) files.push(r)
    }
  }

  return files
}

export async function scanFromGitUrl(gitUrl: string): Promise<ScanOutput> {
  const githubMatch = gitUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/tree\/([^\/]+))?(?:\/|$)/)

  if (!githubMatch) {
    return {
      result: 'warn', score: 50,
      summary: { filesScanned: 0, critical: 0, high: 0, medium: 1, low: 0 },
      findings: [{
        type: 'warning', category: 'unsupported',
        message: 'Only GitHub repositories are currently supported for automated scanning',
        severity: 'medium',
      }],
    }
  }

  const [, owner, repo, branch] = githubMatch

  try {
    const files = await fetchGithubTree(owner, repo, branch || 'main')
    if (files.length === 0) {
      return {
        result: 'warn', score: 50,
        summary: { filesScanned: 0, critical: 0, high: 0, medium: 1, low: 0 },
        findings: [{
          type: 'warning', category: 'empty_repo',
          message: 'No scannable files found in repository',
          severity: 'medium',
        }],
      }
    }
    return scanSkillPackage(files)
  } catch (error) {
    return {
      result: 'fail', score: 0,
      summary: { filesScanned: 0, critical: 0, high: 1, medium: 0, low: 0 },
      findings: [{
        type: 'error', category: 'fetch_error',
        message: `Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
      }],
    }
  }
}

// ─── VirusTotal Integration (Optional) ───────────────────────────────────────

export async function checkVirusTotal(url: string): Promise<ScanFinding[]> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) return []

  try {
    // Submit URL for scanning
    const submitRes = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(url)}`,
    })
    if (!submitRes.ok) return []

    const submitData = await submitRes.json()
    const analysisId = submitData.data?.id
    if (!analysisId) return []

    // Wait and fetch results
    await new Promise(resolve => setTimeout(resolve, 15000))

    const resultRes = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
      headers: { 'x-apikey': apiKey },
    })
    if (!resultRes.ok) return []

    const resultData = await resultRes.json()
    const stats = resultData.data?.attributes?.stats || {}

    const findings: ScanFinding[] = []
    if (stats.malicious > 0) {
      findings.push({
        type: 'error', category: 'virustotal',
        message: `VirusTotal: ${stats.malicious} engine(s) flagged as malicious`,
        severity: 'critical',
      })
    }
    if (stats.suspicious > 0) {
      findings.push({
        type: 'warning', category: 'virustotal',
        message: `VirusTotal: ${stats.suspicious} engine(s) flagged as suspicious`,
        severity: 'high',
      })
    }
    return findings
  } catch {
    return []
  }
}
