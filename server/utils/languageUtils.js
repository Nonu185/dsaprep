/**
 * Language utility functions for DSA Placement OS
 */
const normalizeLanguage = (lang) => {
  if (!lang) return 'Java';
  const l = lang.trim().toLowerCase();
  if (l === 'javascript' || l === 'js' || l === 'node' || l === 'nodejs') return 'JavaScript';
  if (l === 'python' || l === 'python3' || l === 'py') return 'Python';
  return 'Java';
};

const getPlatformFromUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const u = url.toLowerCase();
  if (u.includes('leetcode.com')) return 'LeetCode';
  if (u.includes('geeksforgeeks.org')) return 'GeeksforGeeks';
  if (u.includes('hackerrank.com')) return 'HackerRank';
  if (u.includes('codeforces.com')) return 'Codeforces';
  if (u.includes('interviewbit.com')) return 'InterviewBit';
  return 'External Platform';
};

module.exports = {
  normalizeLanguage,
  getPlatformFromUrl
};
