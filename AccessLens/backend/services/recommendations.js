/**
 * AccessLens Rule-Based Fix Recommendations Engine
 * Provides structured remediation guidance (explanation, incorrectCode, correctedCode)
 * for key WCAG 2 A/AA accessibility rules, with generic fallback.
 */

const RULE_RECOMMENDATIONS = {
  'image-alt': {
    explanation: 'Images must have an alt attribute describing their content or function. Decorative images should use an empty alt attribute (alt="").',
    incorrectCode: '<img src="chart.png">',
    correctedCode: '<img src="chart.png" alt="Quarterly revenue growth chart showing 15% increase">'
  },
  'label': {
    explanation: 'Form elements must have an associated <label> element (via for/id) or aria-label so screen reader users understand what input is expected.',
    incorrectCode: '<input type="text" placeholder="Enter your email">',
    correctedCode: '<label for="email">Email Address</label>\n<input id="email" type="text" placeholder="name@example.com">'
  },
  'color-contrast': {
    explanation: 'Text must have a contrast ratio of at least 4.5:1 against its background (3:1 for large text >= 18pt or bold >= 14pt) to ensure readability.',
    incorrectCode: '/* Failing contrast ratio (2.1:1) */\ncolor: #94a3b8; background-color: #ffffff;',
    correctedCode: '/* Accessible contrast ratio (7.2:1) */\ncolor: #1e293b; background-color: #ffffff;'
  },
  'button-name': {
    explanation: 'Buttons must have discernible, accessible text content or an aria-label attribute so assistive technology can announce their purpose.',
    incorrectCode: '<button class="icon-btn"><svg>...</svg></button>',
    correctedCode: '<button class="icon-btn" aria-label="Close dialog"><svg>...</svg></button>'
  },
  'link-name': {
    explanation: 'Hyperlinks must have discernible text indicating their destination. Avoid generic text like "click here" or empty anchor tags.',
    incorrectCode: '<a href="/docs">Click here</a>',
    correctedCode: '<a href="/docs">Read the AccessLens Documentation</a>'
  },
  'duplicate-id': {
    explanation: 'HTML id attribute values must be unique on the page to prevent broken label associations, focus traps, and assistive technology confusion.',
    incorrectCode: '<input id="name" name="first">\n<input id="name" name="last">',
    correctedCode: '<input id="first-name" name="first">\n<input id="last-name" name="last">'
  },
  'heading-order': {
    explanation: 'Headings (<h1> through <h6>) must follow a sequential hierarchy without skipping levels (e.g. <h1> directly to <h3>) for structured navigation.',
    incorrectCode: '<h1>Accessibility Report</h1>\n<h3>Section Details (skipped h2)</h3>',
    correctedCode: '<h1>Accessibility Report</h1>\n<h2>Section Details</h2>'
  },
  'html-has-lang': {
    explanation: 'The <html> root element must have a valid lang attribute so screen readers apply correct voice synthesis, pronunciation, and translation.',
    incorrectCode: '<html>',
    correctedCode: '<html lang="en">'
  },
  'document-title': {
    explanation: 'The document must contain a non-empty <title> inside the <head> element to clearly identify the page topic in browser tabs and screen readers.',
    incorrectCode: '<head>\n  <!-- Missing <title> -->\n</head>',
    correctedCode: '<head>\n  <title>AccessLens - Automated Accessibility Auditor</title>\n</head>'
  }
};

/**
 * Returns a rule-based recommendation object for a given rule.
 * @param {string} ruleId - axe-core rule identifier
 * @param {string} [help] - axe-core help string
 * @param {string} [helpUrl] - axe-core documentation link
 * @returns {{ explanation: string, incorrectCode: string, correctedCode: string }}
 */
function getRecommendation(ruleId, help = '', helpUrl = '') {
  if (RULE_RECOMMENDATIONS[ruleId]) {
    return RULE_RECOMMENDATIONS[ruleId];
  }

  // Generic fallback using axe help text
  const explanation = help
    ? `Remediation guidance: ${help}. Ensure compliance with WCAG 2 A/AA criteria.`
    : 'Review this element against WCAG 2 A/AA specifications and ensure proper semantic HTML or ARIA attributes.';

  const incorrectCode = `<!-- Element flagged by rule: ${ruleId} -->`;
  const correctedCode = helpUrl
    ? `<!-- Consult WCAG rule guidelines: ${helpUrl} -->`
    : '<!-- Apply appropriate semantic HTML or ARIA attributes -->';

  return {
    explanation,
    incorrectCode,
    correctedCode
  };
}

module.exports = {
  getRecommendation,
  RULE_RECOMMENDATIONS
};
