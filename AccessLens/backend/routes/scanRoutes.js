const express = require('express');
const router = express.Router();
const {
  createScan,
  getScans,
  getScanById,
  getScanReport,
  deleteScan,
  compareScans
} = require('../controllers/scanController');

// GET /api/scans/compare?a=:id&b=:id - Compare two scans
router.get('/compare', compareScans);

// GET /api/scans - History summaries, newest first
router.get('/', getScans);

// POST /api/scans - Run synchronous scan and save
router.post('/', createScan);

// GET /api/scans/:id/report - Stream downloadable PDF report
router.get('/:id/report', getScanReport);

// GET /api/scans/:id - Retrieve full scan by ID
router.get('/:id', getScanById);

// DELETE /api/scans/:id - Delete scan by ID
router.delete('/:id', deleteScan);

module.exports = router;
