const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const User = require('./models/User');
const Contest = require('./models/Contest');
const Question = require('./models/Question');

const MONGODB_URI = 'mongodb+srv://sujaln0609y_db_user:Su%40170905@cluster0.het62pj.mongodb.net/contest_platform?retryWrites=true&w=majority';

async function pushDirectToAtlas() {
  try {
    console.log('Connecting to MongoDB Atlas Cloud directly...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ CONNECTED TO MONGODB ATLAS CLOUD!');

    let admin = await User.findOne({ email: 'mystery0419' });
    if (!admin) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('0419', salt);
      admin = new User({
        name: 'Master Admin',
        email: 'mystery0419',
        password: hash,
        role: 'admin'
      });
      await admin.save();
    }

    // Question 1 for Complete OA 1
    const oa1Q1 = new Question({
      title: 'Two-Pointer Pair Sum Bug Hunt',
      description: 'The function below is intended to check if there exists a pair in a sorted integer array arr that sums up to target K using the two-pointer technique.\n\nNote to Candidate: There can be 0, 1, or multiple bugs in the given code snippet. Identify all bugs present and provide the corrected code snippet.',
      type: 'bug_hunt',
      marks: 10,
      codeSnippet: `bool hasPairWithSum(vector<int>& arr, int K) {\n    int left = 0;\n    int right = arr.size() - 1;\n    \n    while (left < right) {\n        int currentSum = arr[left] + arr[right];\n        \n        if (currentSum == K) {\n            return true;\n        } else if (currentSum > K) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return false;\n}`,
      expectedBug: 'Left incremented when sum > K, and Right decremented when sum < K',
      expectedFix: 'Swap left++ with right-- and right-- with left++'
    });
    await oa1Q1.save();

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
    } else {
      oa1Contest.questions = [oa1Q1._id];
      oa1Contest.isPublished = true;
      await oa1Contest.save();
    }

    console.log('🎉 "Complete OA 1" successfully written to MongoDB Atlas Cloud!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Error:', err);
    process.exit(1);
  }
}

pushDirectToAtlas();
