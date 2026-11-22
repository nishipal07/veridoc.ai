const { app } = require('../server');
const { connectDB } = require('../config/db');

async function testPhaseC() {
  console.log('=== VERIFYING PHASE C END-TO-END API & FRONTEND CONTRACT ===\n');

  // Ensure DB connection is established first
  await connectDB();

  const server = app.listen(5002, async () => {
    try {
      // 1. Test POST /api/scans
      console.log('1. Testing POST /api/scans for https://example.com...');
      const postRes = await fetch('http://127.0.0.1:5002/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      const postJson = await postRes.json();
      if (!postJson.success || !postJson.data?._id) {
        throw new Error('Failed to create scan via API: ' + (postJson.error || 'unknown error'));
      }
      const scanId = postJson.data._id;
      console.log(`✔ Scan created with ID: ${scanId}, Score: ${postJson.data.score}`);

      // 2. Test GET /api/scans (History summaries)
      console.log('\n2. Testing GET /api/scans (History list)...');
      const histRes = await fetch('http://127.0.0.1:5002/api/scans');
      const histJson = await histRes.json();
      if (!histJson.success || !Array.isArray(histJson.data) || histJson.data.length === 0) {
        throw new Error('Failed to get history list');
      }
      console.log(`✔ History returned ${histJson.data.length} scan summaries.`);

      // 3. Test GET /api/scans/:id (Full scan for ScanResult page)
      console.log(`\n3. Testing GET /api/scans/${scanId} (Full scan)...`);
      const getRes = await fetch(`http://127.0.0.1:5002/api/scans/${scanId}`);
      const getJson = await getRes.json();
      if (!getJson.success || getJson.data._id !== scanId) {
        throw new Error('Failed to get scan by ID');
      }
      console.log(`✔ Full scan retrieved: Score=${getJson.data.score}, Summary:`, getJson.data.summary);

      // 4. Test DELETE /api/scans/:id
      console.log(`\n4. Testing DELETE /api/scans/${scanId}...`);
      const delRes = await fetch(`http://127.0.0.1:5002/api/scans/${scanId}`, { method: 'DELETE' });
      const delJson = await delRes.json();
      if (!delJson.success) {
        throw new Error('Failed to delete scan');
      }
      console.log('✔ Scan successfully deleted.');

      server.close(() => {
        console.log('\n=== ALL PHASE C INTEGRATION TESTS PASSED! ===');
        process.exit(0);
      });
    } catch (err) {
      console.error('\n❌ Phase C Test Failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

testPhaseC();
