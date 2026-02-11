import Database from "better-sqlite3";
import path from "path";

// Database path - in project root for development
const DB_PATH = path.join(process.cwd(), "clawdvault.db");

// Singleton database instance
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  // Creators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      wallet_address TEXT,
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Skills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      long_description TEXT,
      author_id TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT, -- JSON array
      price REAL DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      version TEXT DEFAULT '1.0.0',
      success_rate REAL DEFAULT 0,
      install_command TEXT,
      requirements TEXT, -- JSON array
      endpoints TEXT, -- JSON array
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES creators(id)
    )
  `);

  // Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating REAL NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    )
  `);

  // Installs tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS installs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL,
      user_wallet TEXT,
      installed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    )
  `);

  // Purchases tracking table (for paid skills)
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      price REAL NOT NULL,
      tx_hash TEXT,
      chain TEXT DEFAULT 'base',
      status TEXT DEFAULT 'pending',
      purchased_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
    CREATE INDEX IF NOT EXISTS idx_skills_author ON skills(author_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_skill ON reviews(skill_id);
    CREATE INDEX IF NOT EXISTS idx_installs_skill ON installs(skill_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_skill ON purchases(skill_id);
    CREATE INDEX IF NOT EXISTS idx_purchases_wallet ON purchases(wallet_address);
  `);
}

// Types
export interface Creator {
  id: string;
  name: string;
  wallet_address: string | null;
  verified: boolean;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  long_description: string | null;
  author_id: string;
  author?: string; // Populated via join
  author_verified?: boolean;
  category: string;
  tags: string[];
  price: number;
  downloads: number;
  rating: number;
  reviews_count: number;
  verified: boolean;
  version: string;
  success_rate: number;
  install_command: string | null;
  requirements: string[];
  endpoints: string[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  skill_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Purchase {
  id: number;
  skill_id: string;
  wallet_address: string;
  price: number;
  tx_hash: string | null;
  chain: string;
  status: 'pending' | 'completed' | 'failed';
  purchased_at: string;
}

// Helper to parse JSON fields
function parseSkillRow(row: any): Skill {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    endpoints: row.endpoints ? JSON.parse(row.endpoints) : [],
    verified: Boolean(row.verified),
    author_verified: Boolean(row.author_verified),
  };
}

// Database operations
export function getAllSkills(options?: {
  category?: string;
  search?: string;
  sort?: "downloads" | "rating" | "newest";
  limit?: number;
}): Skill[] {
  const db = getDb();
  
  let query = `
    SELECT 
      s.*,
      c.name as author,
      c.verified as author_verified
    FROM skills s
    JOIN creators c ON s.author_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options?.category && options.category !== "All") {
    query += ` AND s.category = ?`;
    params.push(options.category);
  }

  if (options?.search) {
    query += ` AND (s.name LIKE ? OR s.description LIKE ? OR s.tags LIKE ?)`;
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Sorting
  switch (options?.sort) {
    case "rating":
      query += ` ORDER BY s.rating DESC`;
      break;
    case "newest":
      query += ` ORDER BY s.created_at DESC`;
      break;
    default:
      query += ` ORDER BY s.downloads DESC`;
  }

  if (options?.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit);
  }

  const rows = db.prepare(query).all(...params);
  return rows.map(parseSkillRow);
}

export function getSkillById(id: string): Skill | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      s.*,
      c.name as author,
      c.verified as author_verified
    FROM skills s
    JOIN creators c ON s.author_id = c.id
    WHERE s.id = ?
  `).get(id);
  
  return row ? parseSkillRow(row) : null;
}

export function createSkill(skill: Omit<Skill, "created_at" | "updated_at" | "downloads" | "rating" | "reviews_count">): Skill {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO skills (
      id, name, description, long_description, author_id, category, 
      tags, price, verified, version, success_rate, install_command,
      requirements, endpoints
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    skill.id,
    skill.name,
    skill.description,
    skill.long_description || null,
    skill.author_id,
    skill.category,
    JSON.stringify(skill.tags || []),
    skill.price || 0,
    skill.verified ? 1 : 0,
    skill.version || "1.0.0",
    skill.success_rate || 0,
    skill.install_command || `openclaw skill install ${skill.id}`,
    JSON.stringify(skill.requirements || []),
    JSON.stringify(skill.endpoints || [])
  );

  return getSkillById(skill.id)!;
}

export function incrementDownloads(skillId: string, userWallet?: string): void {
  const db = getDb();
  
  // Record the install
  db.prepare(`INSERT INTO installs (skill_id, user_wallet) VALUES (?, ?)`).run(skillId, userWallet || null);
  
  // Update downloads count
  db.prepare(`UPDATE skills SET downloads = downloads + 1 WHERE id = ?`).run(skillId);
}

export function getSkillReviews(skillId: string): Review[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM reviews WHERE skill_id = ? ORDER BY created_at DESC
  `).all(skillId) as Review[];
}

export function addReview(review: Omit<Review, "id" | "created_at">): Review {
  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO reviews (skill_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `).run(review.skill_id, review.user_id, review.rating, review.comment || null);

  // Update skill rating
  const avgRating = db.prepare(`
    SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE skill_id = ?
  `).get(review.skill_id) as { avg: number; count: number };

  db.prepare(`
    UPDATE skills SET rating = ?, reviews_count = ? WHERE id = ?
  `).run(avgRating.avg, avgRating.count, review.skill_id);

  return db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(result.lastInsertRowid) as Review;
}

export function getCategories(): string[] {
  const db = getDb();
  const rows = db.prepare(`SELECT DISTINCT category FROM skills ORDER BY category`).all() as { category: string }[];
  return rows.map(r => r.category);
}

// Purchase functions
export function createPurchase(purchase: Omit<Purchase, "id" | "purchased_at" | "status">): Purchase {
  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO purchases (skill_id, wallet_address, price, tx_hash, chain)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    purchase.skill_id, 
    purchase.wallet_address, 
    purchase.price, 
    purchase.tx_hash || null, 
    purchase.chain || 'base'
  );

  return db.prepare(`SELECT * FROM purchases WHERE id = ?`).get(result.lastInsertRowid) as Purchase;
}

export function updatePurchaseStatus(id: number, status: 'pending' | 'completed' | 'failed', txHash?: string): void {
  const db = getDb();
  if (txHash) {
    db.prepare(`UPDATE purchases SET status = ?, tx_hash = ? WHERE id = ?`).run(status, txHash, id);
  } else {
    db.prepare(`UPDATE purchases SET status = ? WHERE id = ?`).run(status, id);
  }
}

export function hasPurchased(skillId: string, walletAddress: string): boolean {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM purchases 
    WHERE skill_id = ? AND wallet_address = ? AND status = 'completed'
  `).get(skillId, walletAddress.toLowerCase()) as { count: number };
  return result.count > 0;
}

export function getPurchasesByWallet(walletAddress: string): Purchase[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM purchases WHERE wallet_address = ? ORDER BY purchased_at DESC
  `).all(walletAddress.toLowerCase()) as Purchase[];
}

export function createCreator(creator: Omit<Creator, "created_at">): Creator {
  const db = getDb();
  
  db.prepare(`
    INSERT OR IGNORE INTO creators (id, name, wallet_address, verified)
    VALUES (?, ?, ?, ?)
  `).run(creator.id, creator.name, creator.wallet_address || null, creator.verified ? 1 : 0);

  return db.prepare(`SELECT * FROM creators WHERE id = ?`).get(creator.id) as Creator;
}
