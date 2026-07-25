const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'bug_hunt', 'coding'], required: true },
  marks: { type: Number, default: 10 },
  
  // MCQ fields
  options: [{ type: String }],
  correctOption: { type: String }, // e.g. "A", "B", "C", "D"

  // Bug Hunt fields
  codeSnippet: { type: String },
  expectedBug: { type: String },
  expectedFix: { type: String },

  // Coding fields
  starterCode: { type: String },
  driverCode: { type: String }, // Optional driver code (e.g. main function) appended during judging
  inputFormat: { type: String },
  outputFormat: { type: String },
  constraints: { type: String },
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
