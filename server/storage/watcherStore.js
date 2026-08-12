import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'watcher_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

// Pre-seeded initial repositories to monitor out-of-the-box
const INITIAL_REPOS = [
  {
    id: 'facebook/react',
    owner: 'facebook',
    name: 'react',
    fullName: 'facebook/react',
    description: 'The library for web and native user interfaces.',
    htmlUrl: 'https://github.com/facebook/react',
    addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastChecked: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastCommitSha: null,
    status: 'ACTIVE',
  },
  {
    id: 'vercel/next.js',
    owner: 'vercel',
    name: 'next.js',
    fullName: 'vercel/next.js',
    description: 'The React Framework for the Web.',
    htmlUrl: 'https://github.com/vercel/next.js',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastChecked: new Date(Date.now() - 3600000).toISOString(),
    lastCommitSha: null,
    status: 'ACTIVE',
  },
  {
    id: 'expressjs/express',
    owner: 'expressjs',
    name: 'express',
    fullName: 'expressjs/express',
    description: 'Fast, unopinionated, minimalist web framework for node.',
    htmlUrl: 'https://github.com/expressjs/express',
    addedAt: new Date(Date.now() - 86400000).toISOString(),
    lastChecked: new Date(Date.now() - 1800000).toISOString(),
    lastCommitSha: null,
    status: 'ACTIVE',
  }
];

class WatcherStore {
  constructor() {
    this.repos = new Map();
    this.activity = [];
    this.updates = new Map();
    this.loadFromFile();
  }

  loadFromFile() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.repos)) {
          parsed.repos.forEach(r => this.repos.set(r.id.toLowerCase(), r));
        }
        if (Array.isArray(parsed.activity)) {
          this.activity = parsed.activity;
        }
        if (parsed.updates && typeof parsed.updates === 'object') {
          Object.entries(parsed.updates).forEach(([id, val]) => this.updates.set(id, val));
        }
      }
    } catch (e) {
      console.warn("[WatcherStore] Failed to read store file, using fallback state:", e.message);
    }

    // Seed initial repos if empty
    if (this.repos.size === 0) {
      INITIAL_REPOS.forEach(r => this.repos.set(r.id.toLowerCase(), r));
      this.saveToFile();
    }
  }

  saveToFile() {
    try {
      const data = {
        repos: Array.from(this.repos.values()),
        activity: this.activity.slice(0, 100), // Keep last 100
        updates: Object.fromEntries(this.updates.entries()),
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn("[WatcherStore] Failed to write store file:", e.message);
    }
  }

  getWatchedRepos() {
    return Array.from(this.repos.values());
  }

  getRepo(id) {
    if (!id) return null;
    return this.repos.get(id.toLowerCase()) || null;
  }

  addRepo(repoObj) {
    const key = repoObj.id.toLowerCase();
    this.repos.set(key, repoObj);
    this.saveToFile();
    return repoObj;
  }

  removeRepo(id) {
    const key = id.toLowerCase();
    const removed = this.repos.delete(key);
    this.saveToFile();
    return removed;
  }

  updateRepo(id, fields) {
    const key = id.toLowerCase();
    const existing = this.repos.get(key);
    if (!existing) return null;

    const updated = { ...existing, ...fields };
    this.repos.set(key, updated);
    this.saveToFile();
    return updated;
  }

  getActivityLog(limit = 50) {
    return this.activity.slice(0, limit);
  }

  addActivityItem(item) {
    this.activity.unshift(item);
    if (this.activity.length > 200) {
      this.activity = this.activity.slice(0, 200);
    }
    this.saveToFile();
    return item;
  }

  getUpdateDetails(updateId) {
    return this.updates.get(updateId) || null;
  }

  saveUpdateDetails(updateId, details) {
    this.updates.set(updateId, details);
    this.saveToFile();
    return details;
  }
}

export const watcherStore = new WatcherStore();
