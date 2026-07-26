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

// Auto-seed default contests if database is empty
const autoSeedContests = async () => {
  try {
    const existingCount = await Contest.countDocuments();
    if (existingCount > 0) return;

    console.log('🌱 Database has 0 contests. Auto-seeding initial contests...');

    let admin = await User.findOne({ email: (process.env.ADMIN_ID || 'mystery0419').toLowerCase().trim() });

    // 1. Create Demo DSA Practice Contest
    const q1 = new Question({
      title: 'Combined Prefix & Suffix Sum Unique Values',
      description: 'Given an array A of size N. Let pref[i] denote the prefix sum of elements from index 0 to i inclusive, and suff[i] denote the suffix sum of elements from index i to N-1 inclusive. For all valid indices 0 <= i < N, what is the total number of unique values that (pref[i] + suff[i]) can evaluate to?',
      type: 'mcq',
      marks: 10,
      options: ['1', 'N', 'Need the array to determine', 'Number of unique elements'],
      correctOption: 'D'
    });
    await q1.save();

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

    const demoContest = new Contest({
      title: 'Demo DSA Practice Contest',
      description: 'A practice contest featuring prefix/suffix sum logic MCQ and an array sum coding challenge.',
      durationMinutes: 30,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: [q1._id, q2._id],
      isPublished: true,
      createdBy: admin?._id
    });
    await demoContest.save();

    // 2. Create DSA Test 1
    const test1Q1 = new Question({
      title: 'Vector Size vs Capacity',
      description: 'What happens to vector size and capacity after calling vector<int> v; v.push_back(5); v.reserve(10); ?',
      type: 'mcq',
      marks: 10,
      options: ['size = 1, capacity = 10', 'size = 10, capacity = 10', 'size = 1, capacity = 1', 'size = 0, capacity = 10'],
      correctOption: 'A'
    });
    await test1Q1.save();

    const test1Q2 = new Question({
      title: 'Nested Loop Time Complexity',
      description: 'Find the time complexity of a nested loop: for(int i=1; i<=n; i*=2) for(int j=1; j<=i; j++) sum++;',
      type: 'mcq',
      marks: 10,
      options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)'],
      correctOption: 'A'
    });
    await test1Q2.save();

    const test1Contest = new Contest({
      title: 'DSA Test 1 — Array & Complexity Fundamentals',
      description: 'Comprehensive evaluation covering vector memory, nested loop complexity, reference bug hunt, and array prefix sum coding challenge.',
      durationMinutes: 40,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: [test1Q1._id, test1Q2._id],
      isPublished: true,
      createdBy: admin?._id
    });
    await test1Contest.save();

    console.log('🚀 Contests auto-seeded successfully!');
  } catch (err) {
    console.error('Error auto-seeding contests:', err.message);
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
