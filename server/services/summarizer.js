/**
 * Summarizer Abstraction for AlgoDiff Repo Watch
 * Generates provider-independent, deterministic structured summaries strictly traceable
 * to git diff contents, commit messages, and file stats.
 */

/**
 * Detects categories based on commit message, changed files, and diff text.
 */
export function detectCategories({ commitMessage = '', filesChanged = [], diffText = '' }) {
  const categories = new Set();
  const lowerMsg = commitMessage.toLowerCase();
  const lowerDiff = diffText.toLowerCase();

  // Check commit message patterns
  if (lowerMsg.includes('fix') || lowerMsg.includes('bug') || lowerMsg.includes('resolve') || lowerMsg.includes('patch')) {
    categories.add('bug fix');
  }
  if (lowerMsg.includes('feat') || lowerMsg.includes('add') || lowerMsg.includes('implement') || lowerMsg.includes('new')) {
    categories.add('feature');
  }
  if (lowerMsg.includes('security') || lowerMsg.includes('vulnerability') || lowerMsg.includes('auth') || lowerMsg.includes('token') || lowerMsg.includes('crypto')) {
    categories.add('security');
  }
  if (lowerMsg.includes('api') || lowerMsg.includes('endpoint') || lowerMsg.includes('route') || lowerMsg.includes('rest') || lowerMsg.includes('graphql')) {
    categories.add('API');
  }
  if (lowerMsg.includes('ui') || lowerMsg.includes('style') || lowerMsg.includes('css') || lowerMsg.includes('component') || lowerMsg.includes('view') || lowerMsg.includes('modal')) {
    categories.add('UI');
  }
  if (lowerMsg.includes('db') || lowerMsg.includes('sql') || lowerMsg.includes('migration') || lowerMsg.includes('schema') || lowerMsg.includes('database')) {
    categories.add('database');
  }
  if (lowerMsg.includes('pay') || lowerMsg.includes('algo') || lowerMsg.includes('pera') || lowerMsg.includes('x402') || lowerMsg.includes('tx')) {
    categories.add('payments');
  }
  if (lowerMsg.includes('test') || lowerMsg.includes('spec') || lowerMsg.includes('coverage') || lowerMsg.includes('mock')) {
    categories.add('tests');
  }
  if (lowerMsg.includes('doc') || lowerMsg.includes('readme') || lowerMsg.includes('comment') || lowerMsg.includes('changelog')) {
    categories.add('documentation');
  }

  // Check file extensions & path patterns
  for (const file of filesChanged) {
    const fLower = file.toLowerCase();
    if (fLower.includes('test') || fLower.endsWith('.test.js') || fLower.endsWith('.spec.js') || fLower.endsWith('_test.go')) {
      categories.add('tests');
    }
    if (fLower.endsWith('.md') || fLower.includes('docs/') || fLower.endsWith('.txt')) {
      categories.add('documentation');
    }
    if (fLower.endsWith('.css') || fLower.endsWith('.scss') || fLower.endsWith('.jsx') || fLower.endsWith('.tsx') || fLower.includes('components/')) {
      categories.add('UI');
    }
    if (fLower.includes('schema') || fLower.includes('migration') || fLower.endsWith('.sql')) {
      categories.add('database');
    }
    if (fLower.includes('auth') || fLower.includes('security') || fLower.includes('crypto')) {
      categories.add('security');
    }
    if (fLower.includes('api') || fLower.includes('route') || fLower.includes('controller') || fLower.includes('server')) {
      categories.add('API');
    }
    if (fLower.includes('payment') || fLower.includes('x402') || fLower.includes('algo') || fLower.includes('wallet')) {
      categories.add('payments');
    }
  }

  // Default fallback if empty
  if (categories.size === 0) {
    categories.add('feature');
  }

  return Array.from(categories);
}

/**
 * Assesses risk/importance level based on changes.
 */
export function assessRiskLevel({ commitMessage = '', filesChanged = [], stats = {}, categories = [] }) {
  const lowerMsg = commitMessage.toLowerCase();

  if (categories.includes('security') || lowerMsg.includes('breaking') || lowerMsg.includes('critical') || lowerMsg.includes('cve')) {
    return { level: 'Critical', color: 'rose' };
  }

  if (categories.includes('database') || categories.includes('payments') || stats.additions + stats.deletions > 400 || filesChanged.length > 10) {
    return { level: 'High', color: 'amber' };
  }

  if (categories.includes('API') || stats.additions + stats.deletions > 100 || filesChanged.length > 3) {
    return { level: 'Medium', color: 'blue' };
  }

  return { level: 'Low', color: 'emerald' };
}

/**
 * Generates evidence-based concise explanation of why the change matters.
 */
export function generateWhyItMatters({ categories = [], commitMessage = '', filesChanged = [], diffText = '' }) {
  const lowerMsg = commitMessage.toLowerCase();
  
  if (categories.includes('security') || categories.includes('payments') || lowerMsg.includes('valida')) {
    return 'Adds validation or transaction handling before execution, reducing the chance of invalid input or unauthenticated requests reaching core logic.';
  }
  if (categories.includes('tests')) {
    return 'Adds coverage around modified behavior, making regressions easier to detect.';
  }
  if (categories.length === 1 && categories.includes('documentation')) {
    return 'Primarily documentation changes; runtime behavior is not indicated by the diff.';
  }
  if (categories.includes('bug fix')) {
    return 'Addresses reported issues or edge cases in component execution.';
  }
  if (categories.includes('API')) {
    return 'Modifies API endpoints or server routes; downstream service consumers may need to align with signature updates.';
  }
  if (categories.includes('UI')) {
    return 'Updates visual components or layout styling; core backend business logic remains unaffected.';
  }
  if (categories.includes('database')) {
    return 'Modifies database schemas or migrations; data structures or persistence layers are updated.';
  }
  
  return 'Updates codebase logic across the modified files.';
}

/**
 * Provider-independent summarizer function.
 * Generates human-readable summary, key points, categories, and risk indicator.
 */
export function summarizeDiff({ diffText = '', commitMessage = '', filesChanged = [], stats = { totalFiles: 0, additions: 0, deletions: 0 } }) {
  const categories = detectCategories({ commitMessage, filesChanged, diffText });
  const risk = assessRiskLevel({ commitMessage, filesChanged, stats, categories });

  // High-level summary string
  const cleanMsg = commitMessage.split('\n')[0].trim() || 'Repository update';
  const fileCountStr = `${stats.totalFiles || filesChanged.length} file${(stats.totalFiles || filesChanged.length) === 1 ? '' : 's'}`;
  const statStr = `+${stats.additions || 0} / -${stats.deletions || 0}`;
  
  const overview = `${cleanMsg} (${fileCountStr}, ${statStr})`;

  // Structured "What Changed?" bullet points based strictly on actual diff metadata
  const whatChanged = [];

  if (cleanMsg) {
    whatChanged.push(cleanMsg);
  }

  if (filesChanged.length > 0) {
    const topFiles = filesChanged.slice(0, 3);
    const remaining = filesChanged.length - topFiles.length;
    let fileSummary = `Updated ${topFiles.join(', ')}`;
    if (remaining > 0) fileSummary += ` and ${remaining} more`;
    whatChanged.push(fileSummary);
  }

  // Detect specific code additions/deletions from diff text if available
  if (diffText) {
    const lines = diffText.split('\n');
    const addedFunctions = [];

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const match = line.match(/(function|class|const|let|var|export|import|def|async)\s+([a-zA-Z0-9_$]+)/);
        if (match && match[2] && !addedFunctions.includes(match[2])) {
          addedFunctions.push(match[2]);
        }
      }
    }

    if (addedFunctions.length > 0) {
      whatChanged.push(`Added / updated symbols: ${addedFunctions.slice(0, 4).join(', ')}`);
    }
  }

  const whyItMatters = generateWhyItMatters({ categories, commitMessage: cleanMsg, filesChanged, diffText });

  return {
    overview,
    commitMessage: cleanMsg,
    categories,
    riskLevel: risk.level,
    riskColor: risk.color,
    whatChanged,
    importantChanges: whatChanged, // Backward compatibility alias
    whyItMatters,
    stats: {
      filesChanged: stats.totalFiles || filesChanged.length,
      additions: stats.additions || 0,
      deletions: stats.deletions || 0,
    },
    files: filesChanged,
  };
}
