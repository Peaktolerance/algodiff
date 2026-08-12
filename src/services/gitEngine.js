import { createTwoFilesPatch } from 'diff';

/**
 * Sample TechMart Git Repository Data Structure
 */
export const SAMPLE_REPOSITORIES = {
  TechMart: {
    id: 'TechMart',
    name: 'TechMart Payments Engine (Demo)',
    description: 'Core microservice for processing customer transactions',
    branches: ['main'],
    commits: [
      {
        id: 'abc1234567890abcdef1234567890abcdef12345',
        shortId: 'abc1234',
        message: 'Initial payment implementation',
        author: 'DevOne <dev1@techmart.com>',
        date: '2026-08-01T10:00:00Z',
        files: {
          'src/payment.js': `function pay(amount) {
    return amount;
}`
        }
      },
      {
        id: 'def567890abcdef1234567890abcdef12345678',
        shortId: 'def5678',
        message: 'Add payment validation check',
        author: 'DevTwo <dev2@techmart.com>',
        date: '2026-08-05T14:30:00Z',
        files: {
          'src/payment.js': `function pay(amount) {
    if (amount <= 0) {
        return false;
    }

    return amount;
}`
        }
      },
      {
        id: '999a888b777c666d555e444f333e222d111c000b',
        shortId: '999a888',
        message: 'Refactor logging and return structured receipt',
        author: 'LeadDev <lead@techmart.com>',
        date: '2026-08-10T12:00:00Z',
        files: {
          'src/payment.js': `function pay(amount) {
    if (amount <= 0) {
        console.error("Invalid payment amount:", amount);
        return { success: false, error: "Invalid amount" };
    }

    console.log("Payment processed:", amount);
    return { success: true, amount: amount, timestamp: Date.now() };
}`
        }
      }
    ]
  }
};

/**
 * Parses GitHub URL or owner/repo string into { owner, repo }
 * @param {string} input 
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseGitHubUrl(input) {
  if (!input || typeof input !== 'string') return null;
  let str = input.trim();
  
  // Remove trailing slashes and .git
  str = str.replace(/\/+$/, '').replace(/\.git$/, '');

  // Extract from full URL like https://github.com/owner/repo
  if (str.includes('github.com/')) {
    const parts = str.split('github.com/')[1].split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  }

  // Extract from owner/repo
  const parts = str.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  return null;
}

/**
 * Fetches recent public commits from GitHub REST API
 * @param {string} owner 
 * @param {string} repo 
 * @returns {Promise<{ id: string, name: string, commits: Array<{ id: string, shortId: string, message: string, author: string, date: string }> }>}
 */
export async function loadPublicGitHubRepo(owner, repo) {
  const repoSlug = `${owner}/${repo}`;
  const apiUrl = `/api/github/repos/${owner}/${repo}/commits?per_page=25`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error(`GitHub repository '${repoSlug}' not found or is private.`);
    }
    throw new Error(errData.error || `Failed to load GitHub repository (${response.status} ${response.statusText})`);
  }

  const commitsData = await response.json();
  if (!Array.isArray(commitsData) || commitsData.length === 0) {
    throw new Error(`No commits found in GitHub repository '${repoSlug}'`);
  }

  const mappedCommits = commitsData.map(c => ({
    id: c.sha,
    shortId: c.shortSha || c.sha.substring(0, 7),
    message: c.message || 'No commit message',
    author: c.author || 'Developer',
    date: c.date || new Date().toISOString(),
  }));

  return {
    id: repoSlug,
    name: repoSlug,
    description: `Public GitHub Repository (${owner}/${repo})`,
    owner,
    repoName: repo,
    isGitHub: true,
    commits: mappedCommits,
  };
}

/**
 * Fetches real unified diff between two commits from GitHub Compare REST API
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} fromSha 
 * @param {string} toSha 
 * @returns {Promise<{ unifiedDiff: string, stats: { filesChanged: number, additions: number, deletions: number } }>}
 */
export async function fetchGitHubCompareDiff(owner, repo, fromSha, toSha) {
  const apiUrl = `/api/github/repos/${owner}/${repo}/compare/${fromSha}...${toSha}`;
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to compare commits on GitHub (${response.status})`);
  }

  const compareData = await response.json();
  return {
    unifiedDiff: compareData.unifiedDiff || '',
    stats: compareData.stats || { filesChanged: 0, additions: 0, deletions: 0 },
  };
}

/**
 * Generates unified diff synchronously (for sample repo) or asynchronously (for GitHub repo)
 * @param {string} repoId 
 * @param {string} fromCommitId 
 * @param {string} toCommitId 
 * @param {Object} [githubRepoObj] 
 * @returns {Promise<{ unifiedDiff: string, stats: { filesChanged: number, additions: number, deletions: number }, fromCommit: Object, toCommit: Object }>}
 */
export async function generateGitDiffAsync(repoId, fromCommitId, toCommitId, githubRepoObj) {
  // Check if repository is loaded public GitHub repository
  if (githubRepoObj && githubRepoObj.isGitHub) {
    const fromCommit = githubRepoObj.commits.find(c => c.id === fromCommitId || c.shortId === fromCommitId) || githubRepoObj.commits[0];
    const toCommit = githubRepoObj.commits.find(c => c.id === toCommitId || c.shortId === toCommitId) || githubRepoObj.commits[1];

    const diffResult = await fetchGitHubCompareDiff(githubRepoObj.owner, githubRepoObj.repoName, fromCommit.id, toCommit.id);

    return {
      ...diffResult,
      fromCommit,
      toCommit,
    };
  }

  // Fallback to sample repository implementation
  const sampleResult = generateGitDiff(repoId, fromCommitId, toCommitId);
  return sampleResult;
}

/**
 * Generates unified diff between two commit snapshots in a repository (Synchronous sample fallback)
 */
export function generateGitDiff(repoId, fromCommitId, toCommitId) {
  const repo = SAMPLE_REPOSITORIES[repoId] || SAMPLE_REPOSITORIES.TechMart;
  const fromCommit = repo.commits.find(c => c.id === fromCommitId || c.shortId === fromCommitId) || repo.commits[0];
  const toCommit = repo.commits.find(c => c.id === toCommitId || c.shortId === toCommitId) || repo.commits[1];

  const allFileKeys = Array.from(new Set([
    ...Object.keys(fromCommit.files || {}),
    ...Object.keys(toCommit.files || {})
  ]));

  let fullDiffText = '';
  let totalAdditions = 0;
  let totalDeletions = 0;
  let filesChangedCount = 0;

  for (const filename of allFileKeys) {
    const oldContent = fromCommit.files[filename] || '';
    const newContent = toCommit.files[filename] || '';

    if (oldContent === newContent) continue;

    filesChangedCount++;
    const patch = createTwoFilesPatch(
      `a/${filename}`,
      `b/${filename}`,
      oldContent,
      newContent,
      `commit ${fromCommit.shortId}`,
      `commit ${toCommit.shortId}`
    );

    fullDiffText += patch + '\n';

    const lines = patch.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        totalAdditions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        totalDeletions++;
      }
    }
  }

  return {
    unifiedDiff: fullDiffText.trim(),
    stats: {
      filesChanged: filesChangedCount,
      additions: totalAdditions,
      deletions: totalDeletions,
    },
    files: allFileKeys,
    fromCommit,
    toCommit,
  };
}
