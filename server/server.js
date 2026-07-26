const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const contestRoutes = require('./routes/contest');
const judgeRoutes = require('./routes/judge');
const submissionRoutes = require('./routes/submission');

const Contest = require('./models/Contest');
const Question = require('./models/Question');
const User = require('./models/User');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Contest Platform API Server is running' });
});

// Auto-seed default contests & ensure Complete OA 1 exists
const autoSeedContests = async () => {
  try {
    let admin = await User.findOne({ email: (process.env.ADMIN_ID || 'mystery0419').toLowerCase().trim() });

    // 1. Ensure Question 1 for Complete OA 1
    let oa1Q1 = await Question.findOne({ title: 'Two-Pointer Pair Sum Bug Hunt' });
    if (!oa1Q1) {
      oa1Q1 = new Question({
        title: 'Two-Pointer Pair Sum Bug Hunt',
        description: 'The function below is intended to check if there exists a pair in a sorted integer array arr that sums up to target K using the two-pointer technique.\n\nNote to Candidate: There can be 0, 1, or multiple bugs in the given code snippet. Identify all bugs present and provide the corrected code snippet.',
        type: 'bug_hunt',
        marks: 10,
        codeSnippet: `bool hasPairWithSum(vector<int>& arr, int K) {\n    int left = 0;\n    int right = arr.size() - 1;\n    \n    while (left < right) {\n        int currentSum = arr[left] + arr[right];\n        \n        if (currentSum == K) {\n            return true;\n        } else if (currentSum > K) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return false;\n}`,
        expectedBug: 'Left incremented when sum > K, and Right decremented when sum < K',
        expectedFix: 'Swap left++ with right-- and right-- with left++'
      });
      await oa1Q1.save();
    } else {
      oa1Q1.marks = 10;
      await oa1Q1.save();
    }

    // 2. Ensure "Complete OA 1" contest exists
    let oa1Contest = await Contest.findOne({ title: 'Complete OA 1' });
    if (!oa1Contest) {
      oa1Contest = new Contest({
        title: 'Complete OA 1',
        description: 'Official Online Assessment containing two-pointer bug hunt and advanced coding challenges.',
        durationMinutes: 45,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        questions: [oa1Q1._id],
        isPublished: true,
        createdBy: admin?._id
      });
      await oa1Contest.save();
      console.log('🚀 Pushed "Complete OA 1" to MongoDB Cloud!');
    } else {
      oa1Contest.questions = [oa1Q1._id];
      oa1Contest.isPublished = true;
      await oa1Contest.save();
    }
  } catch (err) {
    console.error('Error seeding contests:', err.message);
  }
};

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contest_platform';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Database');
    await autoSeedContests();
    app.listen(PORT, () => {
      console.log(`🚀 Contest Platform Backend Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('💡 Note: Server running in fallback mode. Ensure MONGODB_URI is configured in .env');
    app.listen(PORT, () => {
      console.log(`🚀 Backend listening on port ${PORT}`);
    });
  });
