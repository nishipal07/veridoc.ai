require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const scanRoutes = require('./routes/scanRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health and information route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'AccessLens API',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      disclaimer: 'AccessLens provides automated accessibility checks using axe-core. This is not a legal or official WCAG certification.'
    }
  });
});

// Scan routes
app.use('/api/scans', scanRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error.'
  });
});

/**
 * Connect to MongoDB with automated fallback to in-memory MongoDB
 * to ensure zero-friction hackathon and local evaluation.
 */
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`AccessLens backend running on http://localhost:${PORT}`);
  });
}

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
