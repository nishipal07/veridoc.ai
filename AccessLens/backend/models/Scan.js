const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  selector: {
    type: String,
    required: true
  },
  html: {
    type: String,
    required: true,
    maxlength: 300 // Trimmed snippet, never store full HTML
  }
}, { _id: false });

const RecommendationSchema = new mongoose.Schema({
  explanation: {
    type: String,
    default: ''
  },
  incorrectCode: {
    type: String,
    default: ''
  },
  correctedCode: {
    type: String,
    default: ''
  }
}, { _id: false });

const IssueSchema = new mongoose.Schema({
  ruleId: {
    type: String,
    required: true
  },
  impact: {
    type: String,
    enum: ['critical', 'serious', 'moderate', 'minor'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  help: {
    type: String,
    required: true
  },
  helpUrl: {
    type: String,
    required: true
  },
  recommendation: {
    type: RecommendationSchema,
    required: true
  },
  nodes: [NodeSchema]
}, { _id: false });

const ScanSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  summary: {
    critical: { type: Number, default: 0 },
    serious: { type: Number, default: 0 },
    moderate: { type: Number, default: 0 },
    minor: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  issues: [IssueSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for query sorting by newest first
ScanSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Scan', ScanSchema);
