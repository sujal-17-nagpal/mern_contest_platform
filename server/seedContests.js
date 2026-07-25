const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Contest = require('./models/Contest');
const Question = require('./models/Question');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contest_platform';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for updating Q4 starter code...');

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

    await Contest.deleteMany({ title: /DSA Test 1/i });

    const q1 = new Question({
      title: 'Vector Size vs Capacity',
      description: 'What happens to vector size and capacity after calling vector<int> v; v.push_back(5); v.reserve(10); ?',
      type: 'mcq',
      marks: 10,
      options: [
        'size = 1, capacity = 10',
        'size = 10, capacity = 10',
        'size = 1, capacity = 1',
        'size = 0, capacity = 10'
      ],
      correctOption: 'A'
    });
    await q1.save();

    const q2 = new Question({
      title: 'Nested Loop Time Complexity',
      description: 'Find the time complexity of a nested loop: for(int i=1; i<=n; i*=2) for(int j=1; j<=i; j++) sum++;',
      type: 'mcq',
      marks: 10,
      options: [
        'O(N)',
        'O(N log N)',
        'O(N^2)',
        'O(log N)'
      ],
      correctOption: 'A'
    });
    await q2.save();

    const q3 = new Question({
      title: 'Pass Vector by Reference Bug Hunt',
      description: 'Identify the bug in the function below where modifying vector elements inside helper function does not update the caller array. Explain the fix.',
      type: 'bug_hunt',
      marks: 15,
      codeSnippet: `void doubleElements(vector<int> arr) {\n    for(int i = 0; i < arr.size(); i++) {\n        arr[i] *= 2;\n    }\n}`,
      expectedBug: 'Vector passed by value instead of reference',
      expectedFix: 'Change parameter signature to void doubleElements(vector<int>& arr)'
    });
    await q3.save();

    // Q4 Starter code is NOW AN EMPTY TEMPLATE!
    const q4 = new Question({
      title: 'Array Prefix Sum Calculation',
      description: 'Given an array of integers, write a function solve(vector<int>& arr) that returns the sum of all elements in the array.',
      type: 'coding',
      marks: 25,
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
    await q4.save();

    const test1Contest = new Contest({
      title: 'DSA Test 1 — Array & Complexity Fundamentals',
      description: 'Comprehensive evaluation covering vector memory, nested loop complexity, reference bug hunt, and array prefix sum coding challenge.',
      durationMinutes: 40,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: [q1._id, q2._id, q3._id, q4._id],
      isPublished: true,
      createdBy: admin._id
    });
    await test1Contest.save();

    console.log('🚀 Cleaned Q4 starterCode in MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating contest:', err);
    process.exit(1);
  }
}

seed();
