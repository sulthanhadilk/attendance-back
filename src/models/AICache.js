const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  // Attendance risk score (0-100)
  attendanceRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Performance/academic risk score (0-100)
  performanceRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Overall combined risk score
  overallRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Risk category
  riskCategory: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  // Detailed analytics
  analytics: {
    // Attendance metrics
    attendancePercentage: { type: Number, default: 0 },
    prayerAttendancePercentage: { type: Number, default: 0 },
    absentDaysCount: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    
    // Academic metrics
    averageMarks: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    failedSubjects: { type: Number, default: 0 },
    
    // Discipline metrics
    totalFines: { type: Number, default: 0 },
    unpaidFines: { type: Number, default: 0 },
    conductIncidents: { type: Number, default: 0 },
    highSeverityIncidents: { type: Number, default: 0 }
  },
  // AI-generated recommendations
  recommendations: [{
    type: {
      type: String,
      enum: ['attendance', 'academic', 'discipline', 'counseling', 'parent_meeting']
    },
    message: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Study suggestions
  studySuggestions: [{
    subject: String,
    suggestion: String,
    resources: [String]
  }],
  // Last update timestamp
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Data freshness - when was this calculated
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  // TTL - cache expiry (in seconds, e.g., 24 hours = 86400)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, { timestamps: true });

// Indexes for efficient queries
aiCacheSchema.index({ studentId: 1 });
aiCacheSchema.index({ riskCategory: 1 });
aiCacheSchema.index({ overallRiskScore: -1 });
aiCacheSchema.index({ expiresAt: 1 }); // For TTL cleanup
aiCacheSchema.index({ calculatedAt: -1 });

// Method to check if cache is stale
aiCacheSchema.methods.isStale = function(maxAgeHours = 24) {
  const ageMs = Date.now() - this.calculatedAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours > maxAgeHours;
};

// Method to calculate overall risk
aiCacheSchema.methods.calculateOverallRisk = function() {
  // Weighted average: attendance 40%, performance 40%, discipline 20%
  this.overallRiskScore = Math.round(
    (this.attendanceRiskScore * 0.4) +
    (this.performanceRiskScore * 0.4) +
    ((this.analytics.conductIncidents > 0 ? 50 : 0) * 0.2)
  );
  
  // Determine risk category
  if (this.overallRiskScore >= 75) {
    this.riskCategory = 'critical';
  } else if (this.overallRiskScore >= 50) {
    this.riskCategory = 'high';
  } else if (this.overallRiskScore >= 25) {
    this.riskCategory = 'medium';
  } else {
    this.riskCategory = 'low';
  }
  
  return this.overallRiskScore;
};

// Pre-save hook to update timestamps
aiCacheSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.calculatedAt = new Date();
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // Auto-calculate overall risk if not set
  if (!this.overallRiskScore || this.overallRiskScore === 0) {
    this.calculateOverallRisk();
  }
  
  next();
});

module.exports = mongoose.model('AICache', aiCacheSchema);
