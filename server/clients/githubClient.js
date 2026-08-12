const fetchFn = globalThis.fetch || (async (...args) => {
  const mod = await import('node-fetch');
  return mod.default(...args);
});

/**
 * Parses GitHub URL or owner/repo string into { owner, repo }
 * @param {string} input 
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseGitHubInput(input) {
  if (!input || typeof input !== 'string') return null;
  let str = input.trim();
  
  // Remove trailing slashes and .git suffix
  str = str.replace(/\/+$/, '').replace(/\.git$/, '');

  // Extract from full URL like https://github.com/owner/repo or http://github.com/owner/repo
  if (str.includes('github.com/')) {
    const parts = str.split('github.com/')[1].split('/');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }
  }

  // Extract from owner/repo format
  const parts = str.split('/');
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }

  return null;
}

const GITHUB_HEADERS = {
  'User-Agent': 'AlgoDiff-RepoWatcher/1.0',
  'Accept': 'application/vnd.github.v3+json',
};

/**
 * Fetches repository info from GitHub REST API
 */
export async function fetchGitHubRepoDetails(owner, repo) {
  const repoSlug = `${owner}/${repo}`;
  const url = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const response = await fetchFn(url, { headers: GITHUB_HEADERS });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository '${repoSlug}' could not be found.`);
      }
      if (response.status === 403) {
        throw new Error(`GitHub API rate limit reached. Please try again later.`);
      }
      throw new Error(`Unable to check repository '${repoSlug}' right now.`);
    }

    const data = await response.json();
    return {
      id: repoSlug,
      owner: data.owner?.login || owner,
      name: data.name || repo,
      fullName: data.full_name || repoSlug,
      description: data.description || `Public GitHub repository (${repoSlug})`,
      defaultBranch: data.default_branch || 'main',
      htmlUrl: data.html_url || `https://github.com/${repoSlug}`,
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      openIssues: data.open_issues_count || 0,
    };
  } catch (err) {
    throw new Error(err.message || `Unable to check repository '${repoSlug}' right now.`);
  }
}

/**
 * Fetches recent commits for a repository
 */
export async function fetchGitHubCommits(owner, repo, limit = 15) {
  const repoSlug = `${owner}/${repo}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`;

  try {
    const response = await fetchFn(url, { headers: GITHUB_HEADERS });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository '${repoSlug}' could not be found.`);
      }
      if (response.status === 403) {
        throw new Error(`GitHub API rate limit reached. Please try again later.`);
      }
      throw new Error(`Unable to check repository '${repoSlug}' right now.`);
    }

    const commitsData = await response.json();
    if (!Array.isArray(commitsData) || commitsData.length === 0) {
      return [];
    }

    return commitsData.map(c => ({
      sha: c.sha,
      shortSha: c.sha.substring(0, 7),
      message: (c.commit?.message || 'No commit message').split('\n')[0],
      fullMessage: c.commit?.message || '',
      author: `${c.commit?.author?.name || 'Developer'} <${c.commit?.author?.email || 'dev@github.com'}>`,
      date: c.commit?.author?.date || new Date().toISOString(),
      url: c.html_url || `https://github.com/${repoSlug}/commit/${c.sha}`,
    }));
  } catch (err) {
    throw new Error(err.message || `Unable to check repository '${repoSlug}' right now.`);
  }
}

/**
 * Fetches git diff and commit comparison between baseSha and headSha
 */
export async function fetchGitHubDiff(owner, repo, baseSha, headSha) {
  const repoSlug = `${owner}/${repo}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`;

  try {
    const response = await fetchFn(url, { headers: GITHUB_HEADERS });
    if (!response.ok) {
      throw new Error(`Failed to compare commits ${baseSha.substring(0,7)}...${headSha.substring(0,7)} on GitHub (${response.status})`);
    }

    const compareData = await response.json();
    const files = compareData.files || [];

    let fullDiffText = '';
    let totalAdditions = 0;
    let totalDeletions = 0;
    const changedFileNames = [];

    for (const file of files) {
      changedFileNames.push(file.filename);
      fullDiffText += `diff --git a/${file.filename} b/${file.filename}\n`;
      fullDiffText += `--- a/${file.filename}\n`;
      fullDiffText += `+++ b/${file.filename}\n`;
      fullDiffText += (file.patch || '@@ -0,0 +1 @@\n+ [Binary or large file changed]') + '\n\n';

      totalAdditions += file.additions || 0;
      totalDeletions += file.deletions || 0;
    }

    const filesDetails = files.map(f => ({
      filename: f.filename,
      status: f.status || 'modified',
      additions: f.additions || 0,
      deletions: f.deletions || 0,
    }));

    return {
      unifiedDiff: fullDiffText.trim(),
      filesChanged: changedFileNames,
      filesDetails,
      stats: {
        totalFiles: files.length,
        additions: totalAdditions,
        deletions: totalDeletions,
      },
      status: compareData.status,
      aheadBy: compareData.ahead_by,
      behindBy: compareData.behind_by,
    };
  } catch (err) {
    throw new Error(err.message || `Could not fetch diff for '${repoSlug}'`);
  }
}
