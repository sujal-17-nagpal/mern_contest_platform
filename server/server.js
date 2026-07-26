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

    console.log('🌱 Seeding CS Fundamentals Speed Test (20 MCQs x 2 Marks)...');

    const mcqQuestions = [
      // 1-5: OOPs
      { title: 'OOPs: Data Encapsulation', description: 'What is the process of wrapping data and methods into a single unit called?', options: ['Polymorphism', 'Encapsulation', 'Inheritance', 'Abstraction'], correctOption: 'B' },
      { title: 'OOPs: Method Overriding', description: 'Which feature of OOP allows a subclass to provide a specific implementation of a method defined in its parent class?', options: ['Method Overloading', 'Method Overriding', 'Encapsulation', 'Abstraction'], correctOption: 'B' },
      { title: 'OOPs: Default Constructor', description: 'Which constructor is automatically invoked when an object is instantiated without any arguments?', options: ['Parameterized Constructor', 'Default Constructor', 'Copy Constructor', 'Virtual Constructor'], correctOption: 'B' },
      { title: 'OOPs: Keyword Reference', description: 'What does the `this` pointer/keyword refer to inside an instance method?', options: ['Current class', 'Parent class', 'Current object instance', 'Global scope'], correctOption: 'C' },
      { title: 'OOPs: Polymorphism Concept', description: 'Which OOP concept allows objects of different derived classes to be treated uniformly through a common base class?', options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Data Hiding'], correctOption: 'B' },

      // 6-10: Computer Networks
      { title: 'CN: OSI Network Layer', description: 'Which layer of the OSI model is responsible for routing packets across different networks?', options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Application Layer'], correctOption: 'B' },
      { title: 'CN: Default HTTP Port', description: 'What is the standard default port number used by the HTTP protocol?', options: ['21', '443', '80', '8080'], correctOption: 'C' },
      { title: 'CN: Reliable Transport Protocol', description: 'Which protocol operates at the Transport layer and provides reliable, connection-oriented data transfer?', options: ['UDP', 'IP', 'TCP', 'ICMP'], correctOption: 'C' },
      { title: 'CN: IPv4 Address Size', description: 'What is the total length of an IPv4 address in bits?', options: ['16 bits', '32 bits', '64 bits', '128 bits'], correctOption: 'B' },
      { title: 'CN: Domain Name Resolution', description: 'Which protocol translates human-readable domain names (e.g. google.com) into IP addresses?', options: ['DHCP', 'ARP', 'DNS', 'FTP'], correctOption: 'C' },

      // 11-15: Operating Systems
      { title: 'OS: Program in Execution', description: 'What is a program in execution state called in an Operating System?', options: ['Thread', 'Process', 'Task Manager', 'Interrupt'], correctOption: 'B' },
      { title: 'OS: Deadlock Necessary Conditions', description: 'Under what condition will a deadlock occur when Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait are involved?', options: ['All four conditions hold simultaneously', 'Any two conditions hold', 'Only Circular Wait holds', 'Only Mutual Exclusion holds'], correctOption: 'A' },
      { title: 'OS: CPU Scheduling SJF', description: 'Which CPU scheduling algorithm selects the process with the shortest next CPU burst time?', options: ['FCFS', 'Shortest Job First (SJF)', 'Round Robin', 'Priority Scheduling'], correctOption: 'B' },
      { title: 'OS: Memory Paging', description: 'What memory management scheme eliminates the requirement of contiguous physical memory allocation?', options: ['Paging', 'Swapping', 'Overlays', 'Segmentation Fault'], correctOption: 'A' },
      { title: 'OS: Kernel Role', description: 'Which central component of an OS directly manages CPU, memory, and hardware device interactions?', options: ['Shell', 'Kernel', 'GUI', 'Compiler'], correctOption: 'B' },

      // 16-20: DBMS
      { title: 'DBMS: Primary Key Purpose', description: 'What does a PRIMARY KEY constraint uniquely identify in a relational database table?', options: ['Each column', 'Each row/record', 'Each table', 'Each database'], correctOption: 'B' },
      { title: 'DBMS: ACID Atomicity', description: 'Which ACID property guarantees that all operations inside a transaction complete successfully or none take effect?', options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], correctOption: 'A' },
      { title: 'DBMS: HAVING Clause', description: 'Which SQL clause is specifically used to filter aggregated results produced by a GROUP BY clause?', options: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'], correctOption: 'B' },
      { title: 'DBMS: One-to-Many Relation', description: 'What relationship exists when a single record in Table A is associated with multiple records in Table B?', options: ['One-to-One', 'One-to-Many', 'Many-to-Many', 'Self-Referential'], correctOption: 'B' },
      { title: 'DBMS: DROP Table Command', description: 'Which SQL DDL command permanently removes a table structure along with all its records from the database?', options: ['DELETE', 'TRUNCATE', 'DROP', 'REMOVE'], correctOption: 'C' }
    ];

    const savedQIds = [];
    for (const q of mcqQuestions) {
      let existingQ = await Question.findOne({ title: q.title });
      if (!existingQ) {
        existingQ = new Question({
          title: q.title,
          description: q.description,
          type: 'mcq',
          marks: 2,
          options: q.options,
          correctOption: q.correctOption
        });
        await existingQ.save();
      } else {
        existingQ.marks = 2;
        await existingQ.save();
      }
      savedQIds.push(existingQ._id);
    }

    await Contest.deleteMany({ title: 'CS Fundamentals Speed Test' });

    const csContest = new Contest({
      title: 'CS Fundamentals Speed Test',
      description: 'Comprehensive 20-question speed quiz covering Core CS Concepts: 5 OOPs, 5 Computer Networks, 5 Operating Systems, and 5 DBMS (2 Marks Each).',
      durationMinutes: 30,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: savedQIds,
      isPublished: true,
      createdBy: admin._id
    });
    await csContest.save();

    console.log('🎉 "CS Fundamentals Speed Test" (20 MCQs x 2 Marks = 40 Marks) published successfully!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

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
