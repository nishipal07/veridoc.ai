const Scan = require('../models/Scan');
const { scanUrl } = require('../services/scanner');
const { generatePDFReport } = require('../utils/generatePDF');

/**
 * Controller for AccessLens Scans
 */

/**
 * POST /api/scans
 * Performs an accessibility audit on the provided URL, saves results to MongoDB, and returns the full scan.
 */
async function createScan(req, res) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A valid "url" field is required in the request body.'
      });
    }

    const trimmedUrl = url.trim();

    // Run the audit synchronously
    const scanResult = await scanUrl(trimmedUrl);

    // Save scan to MongoDB
    const newScan = new Scan({
      url: scanResult.url,
      score: scanResult.score,
      summary: scanResult.summary,
      issues: scanResult.issues
    });

    const savedScan = await newScan.save();

    return res.status(201).json({
      success: true,
      data: savedScan
    });
  } catch (err) {
    console.error('Scan execution error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'An unexpected error occurred during the scan.'
    });
  }
}

/**
 * GET /api/scans
 * Returns history summaries of scans, newest first.
 */
async function getScans(req, res) {
  try {
    const scans = await Scan.find({}, {
      url: 1,
      score: 1,
      summary: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: scans
    });
  } catch (err) {
    console.error('Get scans history error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan history.'
    });
  }
}

/**
 * GET /api/scans/:id
 * Retrieves a full scan result by ID.
 */
async function getScanById(req, res) {
  try {
    const { id } = req.params;
    const scan = await Scan.findById(id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: scan
    });
  } catch (err) {
    console.error('Get scan error:', err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid scan ID format.'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan.'
    });
  }
}

/**
 * GET /api/scans/:id/report
 * Generates and streams a downloadable PDF audit report.
 */
async function getScanReport(req, res) {
  try {
    const { id } = req.params;
    const scan = await Scan.findById(id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AccessLens-Report-${scan._id}.pdf"`);

    return generatePDFReport(scan, res);
  } catch (err) {
    console.error('PDF report error:', err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid scan ID format.'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report.'
    });
  }
}

/**
 * DELETE /api/scans/:id
 * Deletes a scan record by ID.
 */
async function deleteScan(req, res) {
  try {
    const { id } = req.params;
    const deletedScan = await Scan.findByIdAndDelete(id);

    if (!deletedScan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Scan deleted',
        id: deletedScan._id
      }
    });
  } catch (err) {
    console.error('Delete scan error:', err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid scan ID format.'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to delete scan.'
    });
  }
}

/**
 * GET /api/scans/compare?a=:id&b=:id
 * Compares two scans and calculates score delta, fixed, new, and still present issues.
 */
async function compareScans(req, res) {
  try {
    const { a, b } = req.query;
    if (!a || !b) {
      return res.status(400).json({
        success: false,
        error: "Both scan IDs 'a' and 'b' are required query parameters."
      });
    }

    const [scanA, scanB] = await Promise.all([
      Scan.findById(a),
      Scan.findById(b)
    ]);

    if (!scanA) {
      return res.status(404).json({
        success: false,
        error: `Baseline scan (ID: ${a}) not found.`
      });
    }

    if (!scanB) {
      return res.status(404).json({
        success: false,
        error: `Target scan (ID: ${b}) not found.`
      });
    }

    // Helper to extract flattened issue items: ruleId + selector
    const extractItems = (scan) => {
      const map = new Map();
      for (const issue of (scan.issues || [])) {
        for (const node of (issue.nodes || [])) {
          const key = `${issue.ruleId}::${node.selector}`;
          if (!map.has(key)) {
            map.set(key, {
              key,
              ruleId: issue.ruleId,
              impact: issue.impact,
              description: issue.description,
              help: issue.help,
              helpUrl: issue.helpUrl,
              recommendation: issue.recommendation,
              selector: node.selector,
              html: node.html
            });
          }
        }
      }
      return map;
    };

    const mapA = extractItems(scanA);
    const mapB = extractItems(scanB);

    const fixed = [];
    const stillPresent = [];
    const newlyIntroduced = [];

    // Check items from A
    for (const [key, item] of mapA.entries()) {
      if (mapB.has(key)) {
        stillPresent.push(item);
      } else {
        fixed.push(item);
      }
    }

    // Check items from B not in A
    for (const [key, item] of mapB.entries()) {
      if (!mapA.has(key)) {
        newlyIntroduced.push(item);
      }
    }

    const scoreDelta = scanB.score - scanA.score;

    return res.status(200).json({
      success: true,
      data: {
        scanA: {
          _id: scanA._id,
          url: scanA.url,
          score: scanA.score,
          summary: scanA.summary,
          createdAt: scanA.createdAt
        },
        scanB: {
          _id: scanB._id,
          url: scanB.url,
          score: scanB.score,
          summary: scanB.summary,
          createdAt: scanB.createdAt
        },
        scoreDelta,
        fixed,
        new: newlyIntroduced,
        stillPresent,
        unchanged: stillPresent
      }
    });
  } catch (err) {
    console.error('Compare scans error:', err.message);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid scan ID format.'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to compare scans.'
    });
  }
}

module.exports = {
  createScan,
  getScans,
  getScanById,
  getScanReport,
  deleteScan,
  compareScans
};
