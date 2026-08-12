/**
 * Frontend REST Client for AlgoDiff Repo Watch API
 */

const API_BASE = ''; // Same domain (proxied by Vite/Nginx to :4020)

/**
 * Helper to handle fetch responses and extract human-readable error messages
 */
async function handleResponse(response, defaultErrorMsg) {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error(defaultErrorMsg || `Server error (${response.status})`);
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error || defaultErrorMsg || `API error (${response.status})`);
  }

  return data;
}

/**
 * Fetches list of watched repositories and platform stats
 */
export async function getWatchedRepos() {
  const res = await fetch(`${API_BASE}/api/watch/repos`);
  return await handleResponse(res, 'Failed to fetch watched repositories');
}

/**
 * Adds a new repository to watch list
 * @param {string} url - GitHub repo URL or owner/repo
 */
export async function addWatchedRepo(url) {
  const res = await fetch(`${API_BASE}/api/watch/repos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return await handleResponse(res, 'Failed to add repository to watch list');
}

/**
 * Removes a repository from watch list
 * @param {string} repoId - e.g. facebook/react
 */
export async function removeWatchedRepo(repoId) {
  const res = await fetch(`${API_BASE}/api/watch/repos/${repoId}`, {
    method: 'DELETE',
  });
  return await handleResponse(res, 'Failed to remove repository');
}

/**
 * Fetches recent activity timeline
 */
export async function getRecentActivity(limit = 50) {
  const res = await fetch(`${API_BASE}/api/watch/activity?limit=${limit}`);
  return await handleResponse(res, 'Failed to fetch activity log');
}

/**
 * Manually triggers a check for new commits across watched repositories
 */
export async function checkRepoUpdates(repoId) {
  const res = await fetch(`${API_BASE}/api/watch/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(repoId ? { repoId } : {}),
  });
  return await handleResponse(res, 'Failed to check for updates');
}

/**
 * Fetches detailed report for a specific update
 */
export async function getUpdateDetails(updateId) {
  const res = await fetch(`${API_BASE}/api/watch/updates/${encodeURIComponent(updateId)}`);
  return await handleResponse(res, 'Failed to load update details');
}

/**
 * Records on-chain verification status on the server
 */
export async function markUpdateVerified({ updateId, txId, confirmedRound, submitter }) {
  const res = await fetch(`${API_BASE}/api/watch/mark-verified`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updateId, txId, confirmedRound, submitter }),
  });
  return await handleResponse(res, 'Failed to update verification status');
}
