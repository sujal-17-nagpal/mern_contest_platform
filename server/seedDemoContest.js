const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Contest = require('./models/Contest');
const Question = require('./models/Question');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contest_platform';

async function seedDemoContest() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB...');

    // Find Master Admin user
    let admin = await User.findOne({ email: (process.env.ADMIN_ID || 'mystery0419').toLowerCase().trim() });
    if (!admin) {
      console.log('Seeding Master Admin account...');
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

    // Delete existing Demo Contest if present to prevent duplicates
    await Contest.deleteMany({ title: /Demo DSA Practice Contest/i });

    // Q1: MCQ - Combined Prefix & Suffix Sum Unique Values
    const q1 = new Question({
      title: 'Combined Prefix & Suffix Sum Unique Values',
      description: 'Given an array A of size N. Let pref[i] denote the prefix sum of elements from index 0 to i inclusive, and suff[i] denote the suffix sum of elements from index i to N-1 inclusive. For all valid indices 0 <= i < N, what is the total number of unique values that (pref[i] + suff[i]) can evaluate to?',
      type: 'mcq',
      marks: 10,
      options: [
        '1',
        'N',
        'Need the array to determine',
        'Number of unique elements'
      ],
      correctOption: 'D'
    });
    await q1.save();

    // Q2: Coding - Calculate Array Sum
    const q2 = new Question({
      title: 'Calculate Array Sum',
      description: 'Given an array of N integers, write a function solve(vector<int>& arr) that returns the total sum of all elements in the array.',
      type: 'coding',
      marks: 20,
      inputFormat: 'Line 1: N (Number of elements)\nLine 2: N space-separated integers',
      outputFormat: 'Single integer representing the sum of all elements',
      constraints: '1 <= N <= 10^5, -10^9 <= arr[i] <= 10^9',
      starterCode: `long long solve(vector<int>& arr) {\n    // Write your code here\n    \n}`,
      driverCode: `int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) cin >> arr[i];\n    cout << solve(arr);\n    return 0;\n}`,
      testCases: [
        { input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false },
        { input: '3\n-1 -2 -3', expectedOutput: '-6', isHidden: false },
        { input: '6\n10 20 30 40 50 60', expectedOutput: '210', isHidden: true }
      ]
    });
    await q2.save();

    // Create & Publish Demo Contest
    const demoContest = new Contest({
      title: 'Demo DSA Practice Contest',
      description: 'A practice contest featuring prefix/suffix sum logic MCQ and an array sum coding challenge.',
      durationMinutes: 30,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: [q1._id, q2._id],
      isPublished: true,
      createdBy: admin._id
    });
    await demoContest.save();

    console.log('🚀 Demo DSA Practice Contest successfully created & published to database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating demo contest:', err);
    process.exit(1);
  }
}

seedDemoContest();
