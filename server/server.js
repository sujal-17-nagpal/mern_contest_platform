const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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
    }

    console.log('🌱 Seeding Full-Stack & Systems Engineering OA (Medium Level - 90 Mins)...');

    // Delete previous version if exists
    await Contest.deleteMany({ title: 'Full-Stack & Systems Engineering OA (Medium)' });

    const mediumQuestionsData = [
      // Q1: MCQ (Clean Title without Topic Tag)
      {
        title: 'Consistent Hashing Node Scaling',
        description: 'When scaling a distributed caching cluster (e.g. Redis cluster), which hashing algorithm minimizes key remap overhead when a new cache node is added or removed?',
        type: 'mcq',
        marks: 5,
        options: ['Modulo Hashing (key % N)', 'Consistent Hashing with Virtual Nodes', 'MD5 Direct Hash Range', 'Round Robin Routing'],
        correctOption: 'B'
      },
      // Q2: MCQ
      {
        title: 'Caching Write Patterns',
        description: 'Which caching pattern writes data directly to the cache database AND persistent database store simultaneously in a single synchronous transaction?',
        type: 'mcq',
        marks: 5,
        options: ['Cache-Aside', 'Write-Through', 'Write-Back (Write-Behind)', 'Read-Through'],
        correctOption: 'B'
      },
      // Q3: MCQ
      {
        title: 'Deadlock Coffman Conditions',
        description: 'Which condition of Coffmans 4 Deadlock Conditions is prevented when worker threads are required to request all necessary resources simultaneously at thread startup?',
        type: 'mcq',
        marks: 5,
        options: ['Mutual Exclusion', 'Hold & Wait', 'No Preemption', 'Circular Wait'],
        correctOption: 'B'
      },
      // Q4: MCQ
      {
        title: 'HTTP/2 Binary Framing & Multiplexing',
        description: 'What core protocol mechanism allows HTTP/2 to send multiple requests and responses concurrently over a single TCP connection without Head-of-Line (HoL) blocking at the application layer?',
        type: 'mcq',
        marks: 5,
        options: ['Domain Sharding', 'Binary Framing & Stream Multiplexing', 'Gzip Chunked Transfer', 'Keep-Alive Pipelines'],
        correctOption: 'B'
      },
      // Q5: MCQ
      {
        title: 'B+ Tree Indexing vs Hash Indexing',
        description: 'Why are B+ Tree indexes preferred over Hash Indexes in relational database management systems like PostgreSQL and MySQL InnoDB?',
        type: 'mcq',
        marks: 5,
        options: ['Hash indexes consume O(N^2) memory', 'B+ Trees support efficient range queries (<, >, BETWEEN) in O(log N) time', 'B+ Trees provide O(1) point lookups', 'Hash indexes do not support primary key constraints'],
        correctOption: 'B'
      },
      // Q6: MCQ
      {
        title: 'Virtual Memory Page Fault Handling',
        description: 'What occurs when a CPU attempts to access a virtual memory address that is valid but currently not loaded in physical RAM (page table entry present but present bit = 0)?',
        type: 'mcq',
        marks: 5,
        options: ['Segmentation Fault (SIGSEGV)', 'Page Fault Exception (handled by OS kernel)', 'Stack Overflow Error', 'Bus Exception'],
        correctOption: 'B'
      },
      // Q7: MCQ
      {
        title: 'Thread-Safe Singleton DCL',
        description: 'In multithreaded C++/Java design, what is the main architectural purpose of using "Double-Checked Locking" when instantiating a Singleton object?',
        type: 'mcq',
        marks: 5,
        options: ['To prevent garbage collection of the instance', 'To avoid expensive mutex locks once the instance is already initialized', 'To force lazy initialization to fail safely', 'To allow multiple singleton instances concurrently'],
        correctOption: 'B'
      },
      // Q8: MCQ
      {
        title: 'CAP Theorem Tradeoffs',
        description: 'In a distributed network experiencing a network partition (P), a database system prioritizing Consistency (C) over Availability (A) will perform which action when a write request arrives at an isolated node?',
        type: 'mcq',
        marks: 5,
        options: ['Accept the write and attempt to sync later', 'Reject or timeout the write request to prevent stale data drift', 'Drop the partition automatically', 'Convert into a single-node system'],
        correctOption: 'B'
      },

      // Q9: Bug Hunt (10 Marks)
      {
        title: 'Thread-Unsafe LRU Cache Race Condition',
        description: 'The C++ class below implements an LRU Cache using a hash map and a doubly-linked list. However, when accessed concurrently by multiple worker threads in a web server, race conditions occur. Identify the concurrency bug and suggest a suitable thread-safe fix.',
        type: 'bug_hunt',
        marks: 10,
        codeSnippet: `class LRUCache {\n    int capacity;\n    list<pair<int, int>> cacheList;\n    unordered_map<int, list<pair<int, int>>::iterator> cacheMap;\npublic:\n    LRUCache(int cap) : capacity(cap) {}\n    \n    int get(int key) {\n        if (cacheMap.find(key) == cacheMap.end()) return -1;\n        auto it = cacheMap[key];\n        int val = it->second;\n        cacheList.erase(it);\n        cacheList.push_front({key, val});\n        cacheMap[key] = cacheList.begin();\n        return val;\n    }\n};`,
        expectedBug: 'Missing mutex synchronization leads to race conditions on shared linked list pointers during concurrent reads/writes.',
        expectedFix: 'Add std::mutex mtx and lock via std::lock_guard<std::mutex> lock(mtx) at the top of get() and put() methods.'
      },

      // Q10: Bug Hunt (10 Marks)
      {
        title: 'Sliding Window Subarray Bug Hunt',
        description: 'The function below attempts to find the length of the longest contiguous subarray whose sum is at most K using the standard 2-pointer sliding window technique. However, it fails on inputs containing negative integers. Identify why it fails and state the fix.',
        type: 'bug_hunt',
        marks: 10,
        codeSnippet: `int maxSubarrayLen(vector<int>& arr, int K) {\n    int left = 0, currentSum = 0, maxLen = 0;\n    for (int right = 0; right < arr.size(); right++) {\n        currentSum += arr[right];\n        while (currentSum > K && left <= right) {\n            currentSum -= arr[left];\n            left++;\n        }\n        maxLen = max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}`,
        expectedBug: 'Sliding window assumes monotonic non-decreasing sum. Negative numbers break monotonicity, making left++ fail to guarantee sum reduction.',
        expectedFix: 'Use Prefix Sum with Monotonic Deque or Hash Map + Binary Search.'
      },

      // Q11: Coding (20 Marks)
      {
        title: 'Longest Subarray with Target Bitwise XOR',
        description: 'Given an array arr of N integers and a target integer K. Write a function int maxSubarrayXOR(vector<int>& arr, int K) to return the length of the longest contiguous subarray whose Bitwise XOR sum equals K. If no such subarray exists, return 0.',
        type: 'coding',
        marks: 20,
        inputFormat: 'Line 1: N K\nLine 2: N space-separated integers',
        outputFormat: 'Single integer representing maximum subarray length',
        constraints: '1 <= N <= 10^5, 0 <= arr[i], K <= 10^9',
        starterCode: `int maxSubarrayXOR(vector<int>& arr, int K) {\n    // Write your code here\n    \n}`,
        driverCode: `int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n, k;\n    if (!(cin >> n >> k)) return 0;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) cin >> arr[i];\n    cout << maxSubarrayXOR(arr, k);\n    return 0;\n}`,
        testCases: [
          { input: '4 6\n4 2 2 6', expectedOutput: '4', isHidden: false },
          { input: '5 5\n1 2 4 8 16', expectedOutput: '0', isHidden: false },
          { input: '5 0\n3 3 3 3 3', expectedOutput: '4', isHidden: true }
        ]
      },

      // Q12: Coding (20 Marks)
      {
        title: 'Daily Server Latency Spike Distance',
        description: 'You are given an array latencies of size N representing server response times in milliseconds across consecutive time intervals. For each interval i, calculate how many intervals you must wait until a strictly higher latency spike occurs. If no higher latency spike occurs in the future, set the value to 0.\n\nWrite a function vector<int> dailyServerSpikes(vector<int>& latencies) to return the resulting array.',
        type: 'coding',
        marks: 20,
        inputFormat: 'Line 1: N\nLine 2: N space-separated integers',
        outputFormat: 'N space-separated integers',
        constraints: '1 <= N <= 10^5, 1 <= latencies[i] <= 10^5',
        starterCode: `vector<int> dailyServerSpikes(vector<int>& latencies) {\n    // Write your code here\n    \n}`,
        driverCode: `int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> arr(n);\n    for(int i = 0; i < n; i++) cin >> arr[i];\n    vector<int> ans = dailyServerSpikes(arr);\n    for(int i = 0; i < n; i++) {\n        cout << ans[i] << (i == n - 1 ? "" : " ");\n    }\n    return 0;\n}`,
        testCases: [
          { input: '8\n73 74 75 71 69 72 76 73', expectedOutput: '1 1 4 2 1 1 0 0', isHidden: false },
          { input: '4\n30 40 50 60', expectedOutput: '1 1 1 0', isHidden: false },
          { input: '5\n60 50 40 30 20', expectedOutput: '0 0 0 0 0', isHidden: true }
        ]
      }
    ];

    const savedQIds = [];
    for (const qData of mediumQuestionsData) {
      let q = await Question.findOne({ title: qData.title });
      if (!q) {
        q = new Question(qData);
        await q.save();
      } else {
        q.title = qData.title;
        q.description = qData.description;
        q.marks = qData.marks;
        if (qData.options) q.options = qData.options;
        if (qData.correctOption) q.correctOption = qData.correctOption;
        if (qData.codeSnippet) q.codeSnippet = qData.codeSnippet;
        if (qData.starterCode) q.starterCode = qData.starterCode;
        if (qData.driverCode) q.driverCode = qData.driverCode;
        if (qData.testCases) q.testCases = qData.testCases;
        await q.save();
      }
      savedQIds.push(q._id);
    }

    const newContest = new Contest({
      title: 'Full-Stack & Systems Engineering OA (Medium)',
      description: 'Comprehensive 90-minute Medium Level Online Assessment covering CS Fundamentals (System Design, OS, Networks, DBMS, OOPs), Concurrency Bug Hunts, and Medium DSA Algorithms (Monotonic Stack & Prefix XOR Hashing).',
      durationMinutes: 90,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: savedQIds,
      isPublished: true,
      createdBy: admin._id
    });
    await newContest.save();

    console.log('🎉 "Full-Stack & Systems Engineering OA (Medium)" (12 Questions, 100 Marks, 90 Mins) published successfully!');
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
    app.listen(PORT, () => {
      console.log(`🚀 Backend listening on port ${PORT}`);
    });
  });
