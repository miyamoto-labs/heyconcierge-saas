export type SkillStatus = 'pending' | 'scanning' | 'verified' | 'rejected' | 'blocked'
export type ScanResult = 'pass' | 'warn' | 'fail'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface Publisher {
  id: string
  wallet_address: string
  github_username: string | null
  display_name: string | null
  verified: boolean
  stake_amount: number
  reputation_score: number
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  description: string | null
  version: string
  git_url: string | null
  package_url: string | null
  publisher_id: string | null
  status: SkillStatus
  scan_result: ScanResult | null
  downloads: number
  category: string | null
  tags: string[] | null
  readme: string | null
  created_at: string
  updated_at: string
  publisher?: Publisher
  scans?: Scan[]
}

export interface Scan {
  id: string
  skill_id: string
  result: ScanResult
  findings: ScanFinding[]
  scanned_at: string
}

export interface ScanFinding {
  type: 'error' | 'warning' | 'info'
  category: string
  message: string
  file?: string
  line?: number
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface Review {
  id: string
  skill_id: string
  publisher_id: string
  rating: number
  comment: string | null
  created_at: string
  publisher?: Publisher
}

export interface Report {
  id: string
  skill_id: string
  reporter_wallet: string
  reason: string
  description: string | null
  status: ReportStatus
  created_at: string
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      publishers: {
        Row: Publisher
        Insert: Omit<Publisher, 'id' | 'created_at' | 'updated_at' | 'reputation_score'> & {
          id?: string
          created_at?: string
          updated_at?: string
          reputation_score?: number
        }
        Update: Partial<Publisher>
      }
      skills: {
        Row: Skill
        Insert: Omit<Skill, 'id' | 'created_at' | 'updated_at' | 'downloads'> & {
          id?: string
          created_at?: string
          updated_at?: string
          downloads?: number
        }
        Update: Partial<Skill>
      }
      scans: {
        Row: Scan
        Insert: Omit<Scan, 'id' | 'scanned_at'> & {
          id?: string
          scanned_at?: string
        }
        Update: Partial<Scan>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Review>
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'status'> & {
          id?: string
          created_at?: string
          status?: ReportStatus
        }
        Update: Partial<Report>
      }
    }
  }
}
