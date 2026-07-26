const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

// Auto-seed Admin & Contests AFTER mongoose connection is established
const seedDatabase = async () => {
  try {
    const adminEmail = (process.env.ADMIN_ID || 'mystery0419').toLowerCase().trim();
    const adminRawPassword = process.env.ADMIN_PASSWORD || '0419';

    let admin = await User.findOne({ email: adminEmail });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminRawPassword, salt);

    if (!admin) {
      admin = new User({
        name: 'Master Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'admin'
      });
      await admin.save();
      console.log(`👑 Master Admin Account Seeded: ${adminEmail}`);
    } else {
      admin.role = 'admin';
      admin.password = passwordHash;
      await admin.save();
    }

    // 1. SEED / UPDATE "Complete OA 1" Question 1
    let oa1Q1 = await Question.findOne({ title: 'Two-Pointer Pair Sum Bug Hunt' });
    if (!oa1Q1) {
      oa1Q1 = new Question({
        title: 'Two-Pointer Pair Sum Bug Hunt',
        description: 'The function below is intended to check if there exists a pair in a sorted integer array arr that sums up to target K using the two-pointer technique.\n\nNote to Candidate: There can be 0, 1, or multiple bugs in the given code snippet. Identify the bug(s) and explain the fix for it.',
        type: 'bug_hunt',
        marks: 10,
        codeSnippet: `bool hasPairWithSum(vector<int>& arr, int K) {\n    int left = 0;\n    int right = arr.size() - 1;\n    \n    while (left < right) {\n        int currentSum = arr[left] + arr[right];\n        \n        if (currentSum == K) {\n            return true;\n        } else if (currentSum > K) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return false;\n}`,
        expectedBug: 'Left incremented when sum > K, and Right decremented when sum < K',
        expectedFix: 'Swap left++ with right-- and right-- with left++'
      });
      await oa1Q1.save();
    } else {
      oa1Q1.description = 'The function below is intended to check if there exists a pair in a sorted integer array arr that sums up to target K using the two-pointer technique.\n\nNote to Candidate: There can be 0, 1, or multiple bugs in the given code snippet. Identify the bug(s) and explain the fix for it.';
      oa1Q1.marks = 10;
      await oa1Q1.save();
    }

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
        createdBy: admin._id
      });
      await oa1Contest.save();
      console.log('🚀 Created & Published "Complete OA 1"');
    } else {
      oa1Contest.questions = [oa1Q1._id];
      oa1Contest.isPublished = true;
      await oa1Contest.save();
      console.log('🚀 Updated & Published "Complete OA 1"');
    }

  } catch (err) {
    console.error('❌ Error during database seeding:', err.message);
  }
};

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contest_platform';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Database');
    await seedDatabase();
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
