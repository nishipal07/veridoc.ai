const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { scanUrl } = require('../services/scanner');
const { getRecommendation } = require('../services/recommendations');
const Scan = require('../models/Scan');

async function runPhaseBTests() {
  console.log('====================================================');
  console.log('       ACCESSLENS PHASE B VERIFICATION SUITE        ');
  console.log('====================================================\n');

  // 1. Verify 9 Required Rule Recommendations + Fallback
  console.log('--- 1. VERIFYING RULE-BASED RECOMMENDATIONS ---');
  const requiredRules = [
    'image-alt',
    'label',
    'color-contrast',
    'button-name',
    'link-name',
    'duplicate-id',
    'heading-order',
    'html-has-lang',
    'document-title'
  ];

  for (const rule of requiredRules) {
    const rec = getRecommendation(rule);
    if (!rec.explanation || !rec.incorrectCode || !rec.correctedCode) {
      throw new Error(`Rule "${rule}" is missing explanation, incorrectCode, or correctedCode.`);
    }
    console.log(`✔ Rule [${rule}] verified:`);
    console.log(`   - Explanation: ${rec.explanation.slice(0, 70)}...`);
    console.log(`   - Incorrect:   ${rec.incorrectCode.replace(/\n/g, ' ')}`);
    console.log(`   - Corrected:   ${rec.correctedCode.replace(/\n/g, ' ')}`);
  }

  const fallback = getRecommendation('some-unknown-axe-rule', 'Generic axe help text', 'https://dequeuniversity.com/rules/axe/4.10/unknown');
  if (!fallback.explanation || !fallback.incorrectCode || !fallback.correctedCode) {
    throw new Error('Generic fallback recommendation failed.');
  }
  console.log('✔ Generic fallback recommendation verified.\n');

  // 2. Initialize In-Memory MongoDB for Test Run
  console.log('--- 2. INITIALIZING DATABASE ---');
  await connectDB();
  console.log('✔ Connected to MongoDB for Phase B tests.\n');

  // 3. Test Scan against https://example.com
  console.log('--- 3. SCANNING: https://example.com ---');
  const t0 = Date.now();
  const scan1 = await scanUrl('https://example.com');
  const dur1 = Date.now() - t0;

  console.log(`Scan completed in ${dur1}ms`);
  console.log(`URL:     ${scan1.url}`);
  console.log(`Score:   ${scan1.score}/100 (Estimated accessibility score)`);
  console.log(`Summary: Total=${scan1.summary.total}, Critical=${scan1.summary.critical}, Serious=${scan1.summary.serious}, Moderate=${scan1.summary.moderate}, Minor=${scan1.summary.minor}`);
  console.log(`Detected Rules (${scan1.issues.length}): ${scan1.issues.map(i => `${i.ruleId} [${i.impact}]`).join(', ') || 'None'}`);

  const doc1 = new Scan(scan1);
  const saved1 = await doc1.save();
  console.log(`✔ Saved to DB with ID: ${saved1._id}\n`);

  // 4. Test Scan against https://www.w3.org/WAI/demos/bad/before/home.html
  console.log('--- 4. SCANNING: https://www.w3.org/WAI/demos/bad/before/home.html ---');
  const t1 = Date.now();
  const scan2 = await scanUrl('https://www.w3.org/WAI/demos/bad/before/home.html');
  const dur2 = Date.now() - t1;

  console.log(`Scan completed in ${dur2}ms`);
  console.log(`URL:     ${scan2.url}`);
  console.log(`Score:   ${scan2.score}/100 (Estimated accessibility score)`);
  console.log(`Summary: Total=${scan2.summary.total}, Critical=${scan2.summary.critical}, Serious=${scan2.summary.serious}, Moderate=${scan2.summary.moderate}, Minor=${scan2.summary.minor}`);
  console.log(`Detected Rules (${scan2.issues.length}):`);
  scan2.issues.forEach((issue, idx) => {
    console.log(`   ${idx + 1}. [${issue.impact.toUpperCase()}] ${issue.ruleId} (${issue.nodes.length} nodes)`);
    console.log(`      Fix: ${issue.recommendation.explanation.slice(0, 90)}...`);
    if (issue.nodes[0]) {
      console.log(`      Selector: ${issue.nodes[0].selector}`);
      console.log(`      Snippet:  ${issue.nodes[0].html.slice(0, 80)}...`);
    }
  });

  const doc2 = new Scan(scan2);
  const saved2 = await doc2.save();
  console.log(`\n✔ Saved to DB with ID: ${saved2._id}\n`);

  // 5. Verify History & Retrieval & Deletion Routes
  console.log('--- 5. VERIFYING DATABASE QUERY OPERATIONS ---');
  // History query (summary only, newest first)
  const history = await Scan.find({}, { url: 1, score: 1, summary: 1, createdAt: 1 }).sort({ createdAt: -1 });
  console.log(`✔ History returned ${history.length} scans (newest first).`);
  console.log(`   1st: ${history[0].url} (Score: ${history[0].score})`);
  console.log(`   2nd: ${history[1].url} (Score: ${history[1].score})`);

  // Retrieve single scan
  const fetchedScan = await Scan.findById(saved2._id);
  if (!fetchedScan || fetchedScan.issues.length !== scan2.issues.length) {
    throw new Error('Failed to retrieve full scan by ID.');
  }
  console.log(`✔ Retrieved full scan by ID (${fetchedScan._id}) with ${fetchedScan.issues.length} detailed issues.`);

  // Delete scan
  await Scan.findByIdAndDelete(saved1._id);
  const remaining = await Scan.find();
  if (remaining.length !== 1) {
    throw new Error(`Delete failed! Expected 1 scan remaining, got ${remaining.length}`);
  }
  console.log(`✔ Deleted scan (${saved1._id}). Remaining scans in DB: ${remaining.length}`);

  // Cleanup
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log('   ALL PHASE B IMPLEMENTATIONS & TESTS PASSED!       ');
  console.log('====================================================');
  process.exit(0);
}

runPhaseBTests().catch((err) => {
  console.error('\n❌ Phase B Verification Failed:', err);
  process.exit(1);
});
