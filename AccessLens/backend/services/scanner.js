const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { validateUrl } = require('../utils/urlValidator');
const { calculateScore } = require('./scoring');
const { getRecommendation } = require('./recommendations');

/**
 * Executes an automated accessibility audit on a public URL.
 * 
 * Safety & Constraints:
 * - SSRF protection validates domain and resolved IP prior to navigation and on redirects.
 * - Restricts axe-core analysis to WCAG 2.0 / 2.1 Level A and AA standard tags.
 * - Strict 30-second navigation timeout.
 * - Chromium browser is always closed inside a finally block.
 * - Full page HTML is never saved; only trimmed snippets (<= 300 chars) and CSS selectors.
 * - Handles very large pages gracefully by limiting stored nodes per rule to max 50.
 * 
 * @param {string} targetUrl - URL to audit
 * @returns {Promise<{ url: string, score: number, summary: object, issues: Array }>}
 */
async function scanUrl(targetUrl) {
  // 1. Initial SSRF and protocol validation
  const validation = await validateUrl(targetUrl);
  if (!validation.isValid) {
    const error = new Error(validation.error);
    error.statusCode = 400;
    throw error;
  }

  const validUrl = validation.parsedUrl.href;
  let browser = null;
  let context = null;

  try {
    // Launch headless chromium with sandboxing flags
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    context = await browser.newContext({
      userAgent: 'AccessLens-Accessibility-Bot/1.0 (+https://accesslens.dev/bot)',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: false
    });

    const page = await context.newPage();

    // Re-check navigation requests to block SSRF redirects to internal/private IPs
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.isNavigationRequest()) {
        const reqUrl = request.url();
        const check = await validateUrl(reqUrl);
        if (!check.isValid) {
          console.warn(`[SSRF Blocked Redirect] ${reqUrl}: ${check.error}`);
          return route.abort('blockedbyclient');
        }
      }
      return route.continue();
    });

    // 2. Navigate to target URL with 30s timeout
    await page.goto(validUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Short stabilization wait for dynamic DOM / client-side scripts
    await page.waitForTimeout(1500);

    // 3. Run axe-core analysis configured strictly for WCAG 2 Level A & AA tags
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

    const axeResults = await axeBuilder.analyze();
    const rawViolations = axeResults.violations || [];

    // 4. Normalize output:
    // - Trim snippets to max 300 chars
    // - Map CSS selectors
    // - For very large pages with thousands of failures, cap stored nodes to max 50 per rule
    const issues = rawViolations.map((violation) => {
      const impact = (violation.impact || 'minor').toLowerCase();
      const allNodes = violation.nodes || [];

      // Cap nodes to prevent document size explosion on massive pages
      const nodes = allNodes.slice(0, 50).map((node) => {
        const selector = Array.isArray(node.target)
          ? node.target.join(' ')
          : String(node.target || 'unknown');

        const trimmedHtml = (node.html || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 300);

        return {
          selector,
          html: trimmedHtml
        };
      });

      return {
        ruleId: violation.id,
        impact: ['critical', 'serious', 'moderate', 'minor'].includes(impact) ? impact : 'minor',
        description: violation.description || '',
        help: violation.help || '',
        helpUrl: violation.helpUrl || '',
        recommendation: getRecommendation(violation.id, violation.help, violation.helpUrl),
        nodes
      };
    });

    // 5. Calculate estimated accessibility score (each violated rule counted once)
    const { score, summary } = calculateScore(issues);

    return {
      url: validUrl,
      score,
      summary,
      issues
    };
  } catch (err) {
    // Friendly error mappings for edge cases
    if (err.name === 'TimeoutError' || (err.message && err.message.toLowerCase().includes('timeout'))) {
      const timeoutError = new Error('Scan timed out: The target website took more than 30 seconds to load or respond.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    if (
      err.message &&
      (err.message.includes('ERR_CONNECTION_REFUSED') ||
       err.message.includes('ERR_NAME_NOT_RESOLVED') ||
       err.message.includes('ERR_ADDRESS_UNREACHABLE') ||
       err.message.includes('ERR_CONNECTION_TIMED_OUT') ||
       err.message.includes('ERR_CONNECTION_RESET') ||
       err.message.includes('ERR_SSL_PROTOCOL_ERROR'))
    ) {
      const unreachableError = new Error('Website unreachable: The destination server refused connection, timed out, or could not be reached.');
      unreachableError.statusCode = 502;
      throw unreachableError;
    }

    if (err.message && err.message.includes('blockedbyclient')) {
      const ssrfError = new Error('Navigation blocked: The website redirected to a forbidden local or private network address.');
      ssrfError.statusCode = 400;
      throw ssrfError;
    }

    throw err;
  } finally {
    // 6. Ensure browser instance is ALWAYS safely closed
    if (context) {
      try {
        await context.close();
      } catch (ctxErr) {
        // Ignored
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('Error closing Playwright browser:', closeErr.message);
      }
    }
  }
}

module.exports = {
  scanUrl
};
