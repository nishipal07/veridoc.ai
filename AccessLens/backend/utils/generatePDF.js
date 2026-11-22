const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional PDF audit report for an AccessLens scan.
 * 
 * Features:
 * - Branded header with audit metadata (URL, timestamp, scan ID)
 * - Large visual Estimated Accessibility Score badge with color coding
 * - Severity breakdown summary table (critical, serious, moderate, minor)
 * - Prominent limitations disclaimer
 * - Itemized list of WCAG violations with failing selectors, code snippets, and before/after fixes
 * - Intelligent page break handling to prevent broken cards
 * 
 * @param {object} scan - The Mongoose Scan document
 * @param {NodeJS.WritableStream} res - The Express response stream
 */
function generatePDFReport(scan, res) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true,
    info: {
      Title: `AccessLens Audit Report - ${scan.url}`,
      Author: 'AccessLens Automated Accessibility Auditor'
    }
  });

  doc.pipe(res);

  const primaryColor = '#4338ca'; // Indigo 700
  const darkSlate = '#0f172a';
  const mutedText = '#64748b';
  const lightBg = '#f8fafc';

  const getScoreColor = (score) => {
    if (score >= 90) return '#059669'; // Emerald
    if (score >= 70) return '#d97706'; // Amber
    return '#e11d48'; // Rose
  };

  const getImpactColor = (impact) => {
    switch ((impact || '').toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'serious': return '#ea580c';
      case 'moderate': return '#ca8a04';
      default: return '#2563eb';
    }
  };

  // --- 1. HEADER SECTION ---
  doc.rect(40, 40, 515, 6).fill(primaryColor);
  doc.moveDown(1);

  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('AccessLens', 40, 56)
    .fontSize(10)
    .font('Helvetica')
    .fillColor(mutedText)
    .text('Automated Website Accessibility Auditor', 40, 82);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(mutedText)
    .text(`Report Generated: ${new Date(scan.createdAt).toUTCString()}`, 300, 58, { align: 'right' })
    .text(`Scan ID: ${scan._id}`, 300, 72, { align: 'right' });

  doc.moveDown(2);
  const dividerY = 100;
  doc.moveTo(40, dividerY).lineTo(555, dividerY).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // --- 2. AUDIT TARGET & SCORE SUMMARY ---
  doc.y = 115;

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(darkSlate)
    .text('Target Website: ', 40, doc.y, { continued: true })
    .font('Helvetica')
    .fillColor(primaryColor)
    .text(scan.url);

  doc.moveDown(0.8);

  // Score Box + Summary Box side by side
  const boxTop = doc.y;
  const scoreColor = getScoreColor(scan.score);

  // Score Box (Left)
  doc.roundedRect(40, boxTop, 180, 100, 8).fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('ESTIMATED ACCESSIBILITY SCORE', 50, boxTop + 14, { width: 160, align: 'center' });

  doc
    .fontSize(38)
    .font('Helvetica-Bold')
    .fillColor(scoreColor)
    .text(`${scan.score}`, 50, boxTop + 32, { width: 160, align: 'center' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(mutedText)
    .text('out of 100', 50, boxTop + 76, { width: 160, align: 'center' });

  // Severity Breakdown (Right)
  doc.roundedRect(230, boxTop, 325, 100, 8).fillAndStroke('#f8fafc', '#e2e8f0');

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(darkSlate)
    .text('Issue Severity Breakdown', 245, boxTop + 14);

  const colWidth = 72;
  const metrics = [
    { label: 'Critical', count: scan.summary?.critical || 0, color: '#dc2626' },
    { label: 'Serious', count: scan.summary?.serious || 0, color: '#ea580c' },
    { label: 'Moderate', count: scan.summary?.moderate || 0, color: '#ca8a04' },
    { label: 'Minor', count: scan.summary?.minor || 0, color: '#2563eb' }
  ];

  metrics.forEach((m, idx) => {
    const x = 245 + idx * colWidth;
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(m.color)
      .text(`${m.count}`, x, boxTop + 40, { width: colWidth, align: 'left' });

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(mutedText)
      .text(m.label.toUpperCase(), x, boxTop + 68, { width: colWidth, align: 'left' });
  });

  // --- 3. LIMITATIONS NOTICE ---
  doc.y = boxTop + 115;

  doc.roundedRect(40, doc.y, 515, 52, 6).fillAndStroke('#fffbeb', '#fef3c7');

  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor('#92400e')
    .text('IMPORTANT LIMITATIONS & COMPLIANCE DISCLAIMER', 50, doc.y + 8);

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#78350f')
    .text(
      'AccessLens performs automated accessibility analysis using axe-core configured for WCAG 2.0/2.1 Level A and AA criteria. Automated testing typically detects 30-50% of all accessibility issues. This report does NOT constitute official WCAG certification or legal compliance verification. Comprehensive accessibility requires manual testing with assistive technologies (screen readers, keyboard-only navigation).',
      50,
      doc.y + 20,
      { width: 495, lineGap: 1.5 }
    );

  doc.y = doc.y + 70;

  // --- 4. DETAILED VIOLATIONS ---
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor(darkSlate)
    .text(`Detected Violations (${scan.issues?.length || 0} Rules Flagged)`, 40, doc.y);

  doc.moveDown(0.5);

  const issues = scan.issues || [];

  if (issues.length === 0) {
    doc.moveDown(1);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(mutedText)
      .text('No automated WCAG 2 A/AA violations were detected for this web page.', 40, doc.y);
  } else {
    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const impactColor = getImpactColor(issue.impact);

      // Check remaining page height to prevent awkward page splits (reserve at least 150pt)
      if (doc.y > 640) {
        doc.addPage();
        doc.y = 50;
      }

      const issueTop = doc.y;

      // Issue Card Border & Background
      doc
        .roundedRect(40, issueTop, 515, 12, 4)
        .fill(lightBg);

      // Impact Tag + Rule ID
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(impactColor)
        .text(`[${(issue.impact || 'minor').toUpperCase()}]`, 45, issueTop + 2, { continued: true })
        .fillColor(darkSlate)
        .text(`  ${issue.ruleId}  `, { continued: true })
        .fontSize(8)
        .font('Helvetica')
        .fillColor(mutedText)
        .text(`(${issue.nodes?.length || 0} elements affected)`);

      doc.y = issueTop + 20;

      // Description / Help text
      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor(darkSlate)
        .text(issue.help || issue.description, 45, doc.y, { width: 505 });

      doc.moveDown(0.4);

      // Rule-based Recommendation
      const rec = issue.recommendation || {};
      const explanation = typeof rec === 'object' ? rec.explanation : rec;
      const incorrect = typeof rec === 'object' ? rec.incorrectCode : '';
      const corrected = typeof rec === 'object' ? rec.correctedCode : '';

      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#4338ca')
        .text('Recommended Fix: ', 45, doc.y, { continued: true })
        .font('Helvetica')
        .fillColor('#1e293b')
        .text(explanation, { width: 505 });

      // Before / After Code Snippet if present
      if (incorrect || corrected) {
        doc.moveDown(0.3);
        const codeY = doc.y;

        if (incorrect) {
          doc
            .fontSize(7.5)
            .font('Courier')
            .fillColor('#dc2626')
            .text(`Incorrect: ${incorrect.replace(/\n/g, ' ')}`, 50, doc.y, { width: 500, lineBreak: false });
        }
        if (corrected) {
          doc
            .fontSize(7.5)
            .font('Courier')
            .fillColor('#059669')
            .text(`Corrected: ${corrected.replace(/\n/g, ' ')}`, 50, doc.y, { width: 500, lineBreak: false });
        }
      }

      // First failing node selector snippet preview
      if (issue.nodes && issue.nodes.length > 0) {
        doc.moveDown(0.4);
        const firstNode = issue.nodes[0];
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor(mutedText)
          .text('Sample Selector: ', 45, doc.y, { continued: true })
          .font('Courier')
          .fillColor('#0f172a')
          .text(firstNode.selector.slice(0, 80));

        if (firstNode.html) {
          doc
            .fontSize(7.5)
            .font('Courier')
            .fillColor('#475569')
            .text(`HTML: ${firstNode.html.replace(/\s+/g, ' ').slice(0, 100)}`, 45, doc.y + 2, { width: 500 });
        }
      }

      doc.moveDown(1);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      doc.moveDown(0.8);
    }
  }

  // --- 5. PAGE NUMBERING FOOTER ON ALL PAGES ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(mutedText)
      .text(
        `AccessLens Accessibility Audit Report  ·  Page ${i + 1} of ${range.count}`,
        40,
        800,
        { width: 515, align: 'center' }
      );
  }

  doc.end();
}

module.exports = {
  generatePDFReport
};
