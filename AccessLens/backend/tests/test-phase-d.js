const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB } = require('../config/db');
const Scan = require('../models/Scan');

async function runPhaseDTests() {
  console.log('====================================================');
  console.log('       ACCESSLENS PHASE D VERIFICATION SUITE        ');
  console.log('====================================================\n');

  // Ensure DB connection
  await connectDB();

  const server = app.listen(5003, async () => {
    try {
      console.log('--- 1. SEEDING TWO SCANS FOR COMPARISON ---');
      // Scan A (Baseline)
      const scanA = new Scan({
        url: 'https://example.com/v1',
        score: 65,
        summary: { critical: 2, serious: 2, moderate: 1, minor: 0, total: 5 },
        issues: [
          {
            ruleId: 'image-alt',
            impact: 'critical',
            description: 'Images must have alternate text',
            help: 'Images must have alternate text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
            recommendation: {
              explanation: 'Add alt attributes to images.',
              incorrectCode: '<img src="hero.jpg">',
              correctedCode: '<img src="hero.jpg" alt="Hero banner">'
            },
            nodes: [{ selector: 'img.hero-banner', html: '<img src="hero.jpg">' }]
          },
          {
            ruleId: 'color-contrast',
            impact: 'serious',
            description: 'Elements must have sufficient color contrast',
            help: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
            recommendation: {
              explanation: 'Increase text contrast ratio.',
              incorrectCode: 'color: #94a3b8;',
              correctedCode: 'color: #1e293b;'
            },
            nodes: [{ selector: 'p.footer-note', html: '<p class="footer-note">Note</p>' }]
          }
        ]
      });
      const savedA = await scanA.save();
      console.log(`✔ Baseline Scan A saved with ID: ${savedA._id} (Score: ${savedA.score})`);

      // Scan B (Target - resolved image-alt, added link-name, kept color-contrast)
      const scanB = new Scan({
        url: 'https://example.com/v2',
        score: 85,
        summary: { critical: 0, serious: 1, moderate: 0, minor: 1, total: 2 },
        issues: [
          {
            ruleId: 'color-contrast',
            impact: 'serious',
            description: 'Elements must have sufficient color contrast',
            help: 'Elements must have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
            recommendation: {
              explanation: 'Increase text contrast ratio.',
              incorrectCode: 'color: #94a3b8;',
              correctedCode: 'color: #1e293b;'
            },
            nodes: [{ selector: 'p.footer-note', html: '<p class="footer-note">Note</p>' }]
          },
          {
            ruleId: 'link-name',
            impact: 'minor',
            description: 'Links must have discernible text',
            help: 'Links must have discernible text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/link-name',
            recommendation: {
              explanation: 'Ensure hyperlinks have discernible text.',
              incorrectCode: '<a href="/help">Click here</a>',
              correctedCode: '<a href="/help">Help Center</a>'
            },
            nodes: [{ selector: 'a.contact-link', html: '<a class="contact-link" href="/contact"></a>' }]
          }
        ]
      });
      const savedB = await scanB.save();
      console.log(`✔ Target Scan B saved with ID: ${savedB._id} (Score: ${savedB.score})\n`);

      // 2. Test GET /api/scans/compare?a=:id&b=:id
      console.log('--- 2. TESTING GET /api/scans/compare ---');
      const compareRes = await fetch(`http://127.0.0.1:5003/api/scans/compare?a=${savedA._id}&b=${savedB._id}`);
      const compareJson = await compareRes.json();

      console.log('Compare HTTP Status:', compareRes.status);
      if (!compareJson.success || !compareJson.data) {
        throw new Error('Compare endpoint failed: ' + (compareJson.error || 'unknown'));
      }

      const { scoreDelta, fixed, new: newIssues, stillPresent } = compareJson.data;

      console.log(`✔ Score Delta: ${scoreDelta} (Expected: +20)`);
      if (scoreDelta !== 20) throw new Error(`Expected score delta +20, got ${scoreDelta}`);

      console.log(`✔ Fixed Issues (${fixed.length}):`, fixed.map(i => `${i.ruleId} (${i.selector})`));
      if (fixed.length !== 1 || fixed[0].ruleId !== 'image-alt') {
        throw new Error('Fixed issues matching failed!');
      }

      console.log(`✔ New Issues (${newIssues.length}):`, newIssues.map(i => `${i.ruleId} (${i.selector})`));
      if (newIssues.length !== 1 || newIssues[0].ruleId !== 'link-name') {
        throw new Error('New issues matching failed!');
      }

      console.log(`✔ Still Present Issues (${stillPresent.length}):`, stillPresent.map(i => `${i.ruleId} (${i.selector})`));
      if (stillPresent.length !== 1 || stillPresent[0].ruleId !== 'color-contrast') {
        throw new Error('Still present issues matching failed!');
      }
      console.log('✔ All 3 comparison groups verified successfully.\n');

      // 3. Test GET /api/scans/:id/report (PDF Streaming)
      console.log('--- 3. TESTING GET /api/scans/:id/report (PDF Generation) ---');
      const reportRes = await fetch(`http://127.0.0.1:5003/api/scans/${savedB._id}/report`);
      console.log('Report HTTP Status:', reportRes.status);
      console.log('Content-Type:', reportRes.headers.get('content-type'));
      console.log('Content-Disposition:', reportRes.headers.get('content-disposition'));

      if (reportRes.status !== 200) {
        throw new Error(`Report endpoint returned HTTP ${reportRes.status}`);
      }

      if (reportRes.headers.get('content-type') !== 'application/pdf') {
        throw new Error(`Expected content-type application/pdf, got ${reportRes.headers.get('content-type')}`);
      }

      const buffer = await reportRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const pdfHeader = String.fromCharCode(...bytes.slice(0, 5));
      console.log(`✔ Received binary stream size: ${bytes.length} bytes`);
      console.log(`✔ PDF Magic Bytes Header: "${pdfHeader}" (Expected: "%PDF-")`);

      if (!pdfHeader.startsWith('%PDF-')) {
        throw new Error(`Invalid PDF header: ${pdfHeader}`);
      }
      console.log('✔ PDF document successfully generated and validated!\n');

      // Cleanup seeded test records
      await Scan.deleteMany({ _id: { $in: [savedA._id, savedB._id] } });
      console.log('✔ Seeded test scans cleaned up.');

      server.close(() => {
        console.log('\n====================================================');
        console.log('   ALL PHASE D TESTS COMPLETED SUCCESSFULLY!        ');
        console.log('====================================================');
        process.exit(0);
      });
    } catch (err) {
      console.error('\n❌ Phase D Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

runPhaseDTests();
