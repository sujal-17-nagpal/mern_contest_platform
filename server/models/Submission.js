const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Real-time saved answers & drafts
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    type: { type: String, enum: ['mcq', 'bug_hunt', 'coding'] },
    selectedOption: { type: String },
    bugIdentification: { type: String },
    bugFix: { type: String },
    code: { type: String },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    scoreAwarded: { type: Number, default: 0 }
  }],

  totalScore: { type: Number, default: 0 },
  maxPossibleScore: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'submitted', 'under_review', 'published'], default: 'draft' },
  isResultsPublished: { type: Boolean, default: false },
  instructorFeedback: { type: String },
  submittedAt: { type: Date }
}, { timestamps: true });

// Prevent duplicate submissions for same user in same contest
submissionSchema.index({ contestId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
