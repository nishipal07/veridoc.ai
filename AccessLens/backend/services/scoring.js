/**
 * AccessLens Scoring Engine
 * 
 * Metric: "Estimated accessibility score" (0-100)
 * Formula: score = Math.max(0, 100 - (10 * critical + 6 * serious + 3 * moderate + 1 * minor))
 * 
 * DESIGN CHOICE NOTE:
 * Each violated axe-core rule is counted ONCE toward the penalty, regardless of how many DOM
 * nodes fail that rule on the page. This prevents a single repetitive layout defect (e.g., 20 footer
 * icons missing alt tags) from collapsing the entire score to 0 on its own, providing a more balanced
 * overview of accessibility across distinct WCAG criteria. All individual failing nodes remain fully
 * recorded and visible in the issue details.
 */

/**
 * Calculates the accessibility score and summary from an array of axe violations or processed issues.
 * @param {Array<{ impact: string }>} issues - List of distinct rule violations
 * @returns {{ score: number, summary: { critical: number, serious: number, moderate: number, minor: number, total: number } }}
 */
function calculateScore(issues = []) {
  const summary = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: issues.length
  };

  // Count each violated rule once by impact level
  for (const issue of issues) {
    const impact = (issue.impact || 'minor').toLowerCase();
    if (impact === 'critical') {
      summary.critical += 1;
    } else if (impact === 'serious') {
      summary.serious += 1;
    } else if (impact === 'moderate') {
      summary.moderate += 1;
    } else {
      summary.minor += 1;
    }
  }

  const penalty =
    10 * summary.critical +
    6 * summary.serious +
    3 * summary.moderate +
    1 * summary.minor;

  const score = Math.max(0, 100 - penalty);

  return {
    score,
    summary
  };
}

module.exports = {
  calculateScore
};
