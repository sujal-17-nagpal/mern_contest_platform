const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Contest = require('./models/Contest');
const Question = require('./models/Question');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contest_platform';

async function pushCompleteOA1() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Cloud...');

    let admin = await User.findOne({ email: (process.env.ADMIN_ID || 'mystery0419').toLowerCase().trim() });
    if (!admin) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || '0419', salt);
      admin = new User({
        name: 'Master Admin',
        email: process.env.ADMIN_ID || 'mystery0419',
        password: hash,
        role: 'admin'
      });
      await admin.save();
    }

    // 1. Create or Update Question 1 (Bug Hunt - 10 Marks)
    const q1 = new Question({
      title: 'Two-Pointer Pair Sum Bug Hunt',
      description: 'The function below is intended to check if there exists a pair in a sorted integer array arr that sums up to target K using the two-pointer technique.\n\nNote to Candidate: There can be 0, 1, or multiple bugs in the given code snippet. Identify all bugs present and provide the corrected code snippet.',
      type: 'bug_hunt',
      marks: 10,
      codeSnippet: `bool hasPairWithSum(vector<int>& arr, int K) {\n    int left = 0;\n    int right = arr.size() - 1;\n    \n    while (left < right) {\n        int currentSum = arr[left] + arr[right];\n        \n        if (currentSum == K) {\n            return true;\n        } else if (currentSum > K) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return false;\n}`,
      expectedBug: 'Left incremented when sum > K, and Right decremented when sum < K',
      expectedFix: 'Swap left++ with right-- and right-- with left++'
    });
    await q1.save();

    // 2. Create or Update Contest "Complete OA 1"
    let contest = await Contest.findOne({ title: 'Complete OA 1' });
    if (!contest) {
      contest = new Contest({
        title: 'Complete OA 1',
        description: 'Official Online Assessment containing two-pointer bug hunt and advanced coding challenges.',
        durationMinutes: 40,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        questions: [q1._id],
        isPublished: true,
        createdBy: admin._id
      });
    } else {
      contest.questions = [q1._id];
      contest.isPublished = true;
    }
    await contest.save();

    console.log('🚀 Successfully pushed "Complete OA 1" with Question 1 to MongoDB Cloud!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error pushing to MongoDB:', err);
    process.exit(1);
  }
}

pushCompleteOA1();
