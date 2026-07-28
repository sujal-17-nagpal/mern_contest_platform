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
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Contest Platform API Server is running' });
});

const seedDatabase = async () => {
  try {
    const adminEmail = (process.env.ADMIN_ID || 'mystery0419').toLowerCase().trim();
    const adminRawPassword = process.env.ADMIN_PASSWORD || '0419';
    let admin = await User.findOne({ email: adminEmail });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminRawPassword, salt);
    if (!admin) {
      admin = new User({ name: 'Master Admin', email: adminEmail, password: passwordHash, role: 'admin' });
      await admin.save();
    }

    console.log('🌱 Seeding Fresher SWE OA (52 Questions, 90 Minutes)...');
    await Contest.deleteMany({});
    await Question.deleteMany({});

    const oaQuestions = [
      // Q1 — DBMS
      {
        title: 'Primary Key vs Unique Key',
        description: 'Which of the following correctly describes the difference between a PRIMARY KEY and a UNIQUE KEY in a relational database?',
        type: 'mcq', marks: 2,
        options: [
          'A primary key can have NULL values; a unique key cannot',
          'A table can have only one unique key but multiple primary keys',
          'A primary key cannot have NULL values; a unique key allows NULL values',
          'Both primary key and unique key allow NULL values'
        ],
        correctOption: 'C'
      },
      // Q2 — OS
      {
        title: 'Process State Transition',
        description: 'A process moves from the Running state to the Waiting (Blocked) state. Which of the following is the most likely reason?',
        type: 'mcq', marks: 2,
        options: [
          'The process was preempted by a higher-priority process',
          'The process requested an I/O operation and is waiting for it to complete',
          'The process completed its execution successfully',
          'The process was moved to the ready queue by the scheduler'
        ],
        correctOption: 'B'
      },
      // Q3 — CN
      {
        title: 'OSI Model — End-to-End Reliability',
        description: 'Which layer of the OSI model is responsible for end-to-end error detection, flow control, and reliable data transfer between two communicating hosts?',
        type: 'mcq', marks: 2,
        options: [
          'Network Layer',
          'Data Link Layer',
          'Transport Layer',
          'Session Layer'
        ],
        correctOption: 'C'
      },
      // Q4 — OOP
      {
        title: 'Runtime Polymorphism in Java',
        description: 'What is the output of the following Java code?\n\nclass Animal {\n  void sound() { System.out.println("Animal"); }\n}\nclass Dog extends Animal {\n  void sound() { System.out.println("Dog"); }\n}\npublic class Main {\n  public static void main(String[] args) {\n    Animal a = new Dog();\n    a.sound();\n  }\n}',
        type: 'mcq', marks: 2,
        options: [
          'Animal',
          'Dog',
          'Compilation error',
          'Runtime error'
        ],
        correctOption: 'B'
      },
      // Q5 — System Design
      {
        title: 'URL Shortener — Database Choice',
        description: 'You are designing a URL shortener service (like bit.ly). The core operation is: given a short code, return the original long URL. Which type of database is most suitable for this mapping, given extremely high read throughput requirements?',
        type: 'mcq', marks: 2,
        options: [
          'Graph database',
          'Relational database with full-text search indexes',
          'Key-Value store',
          'Document database with multi-level joins'
        ],
        correctOption: 'C'
      },
      // Q6 — CN
      {
        title: 'ARP Protocol',
        description: 'What is the primary purpose of the Address Resolution Protocol (ARP)?',
        type: 'mcq', marks: 2,
        options: [
          'To translate domain names into IP addresses',
          'To resolve IP addresses to their corresponding MAC addresses',
          'To assign dynamic IP addresses to hosts on a network',
          'To encrypt network packets during transmission'
        ],
        correctOption: 'B'
      },
      // Q7 — DBMS
      {
        title: 'ACID Properties',
        description: 'What does the letter "D" represent in the ACID properties of a database transaction?',
        type: 'mcq', marks: 2,
        options: [
          'Distribution',
          'Durability',
          'Data Integrity',
          'Dependency'
        ],
        correctOption: 'B'
      },
      // Q8 — OOP
      {
        title: 'Encapsulation',
        description: 'Which of the following best defines Encapsulation in Object-Oriented Programming?',
        type: 'mcq', marks: 2,
        options: [
          'The ability of a class to inherit properties and methods from multiple parent classes',
          'The bundling of data (fields) and methods that operate on that data within a single unit (class), and restricting direct access from outside',
          'The process of hiding complex implementation details and showing only a simplified interface to the user',
          'The ability of a single method to behave differently based on the object that calls it'
        ],
        correctOption: 'B'
      },
      // Q9 — OS
      {
        title: 'Deadlock Necessary Condition',
        description: 'Which of the following is NOT a necessary condition for deadlock to occur?',
        type: 'mcq', marks: 2,
        options: [
          'Mutual Exclusion',
          'Preemption (resources can be forcibly taken)',
          'Hold and Wait',
          'Circular Wait'
        ],
        correctOption: 'B'
      },
      // Q10 — System Design
      {
        title: 'Content Delivery Network (CDN)',
        description: 'What is the primary purpose of a Content Delivery Network (CDN) in web system design?',
        type: 'mcq', marks: 2,
        options: [
          'To provide a dedicated database server for each geographic region',
          'To deliver static content (images, CSS, JS) from servers geographically closer to the user, reducing latency',
          'To distribute incoming API requests across multiple application servers',
          'To encrypt all data in transit between the client and the origin server'
        ],
        correctOption: 'B'
      },
      // Q11 — CN
      {
        title: 'TCP vs UDP',
        description: 'Which of the following protocols is connection-oriented and guarantees reliable, ordered delivery of data?',
        type: 'mcq', marks: 2,
        options: [
          'TCP (Transmission Control Protocol)',
          'UDP (User Datagram Protocol)',
          'ICMP (Internet Control Message Protocol)',
          'DNS (Domain Name System)'
        ],
        correctOption: 'A'
      },
      // Q12 — DBMS
      {
        title: 'Third Normal Form (3NF)',
        description: 'A relation is said to be in Third Normal Form (3NF) when it is in 2NF and eliminates which type of dependency?',
        type: 'mcq', marks: 2,
        options: [
          'Partial dependency (non-key attribute depends on part of a composite key)',
          'Multi-valued dependency',
          'Transitive dependency (non-key attribute depends on another non-key attribute)',
          'Join dependency'
        ],
        correctOption: 'C'
      },
      // Q13 — OOP
      {
        title: 'Preventing Method Overriding in Java',
        description: 'Which keyword in Java is used to prevent a method from being overridden in any subclass?',
        type: 'mcq', marks: 2,
        options: [
          'static',
          'private',
          'final',
          'abstract'
        ],
        correctOption: 'C'
      },
      // Q14 — OS
      {
        title: "Belady's Anomaly",
        description: "Belady's anomaly states that increasing the number of page frames can sometimes increase the number of page faults. Which page replacement algorithm suffers from this anomaly?",
        type: 'mcq', marks: 2,
        options: [
          'FIFO (First-In, First-Out)',
          'LRU (Least Recently Used)',
          'Optimal Page Replacement',
          'LFU (Least Frequently Used)'
        ],
        correctOption: 'A'
      },
      // Q15 — System Design
      {
        title: 'Load Balancer Purpose',
        description: 'What is the primary role of a Load Balancer in a distributed system?',
        type: 'mcq', marks: 2,
        options: [
          'To permanently store user session data across all servers',
          'To cache frequently accessed database query results in memory',
          'To distribute incoming network requests evenly across multiple backend servers',
          'To encrypt HTTPS traffic between the client and the server'
        ],
        correctOption: 'C'
      },
      // Q16 — CN
      {
        title: 'DNS Function',
        description: 'What is the primary function of the Domain Name System (DNS)?',
        type: 'mcq', marks: 2,
        options: [
          'To assign dynamic IP addresses to devices joining a network',
          'To translate human-readable domain names (e.g. google.com) into IP addresses',
          'To route IP packets between different networks on the internet',
          'To provide secure encrypted communication between two hosts'
        ],
        correctOption: 'B'
      },
      // Q17 — DBMS
      {
        title: 'TRUNCATE vs DELETE',
        description: 'Which SQL command removes all rows from a table, cannot be rolled back (in most databases), does not fire row-level triggers, and is significantly faster than DELETE on large tables?',
        type: 'mcq', marks: 2,
        options: [
          'DROP TABLE',
          'DELETE FROM table_name',
          'TRUNCATE TABLE table_name',
          'REMOVE FROM table_name'
        ],
        correctOption: 'C'
      },
      // Q18 — OOP
      {
        title: 'Interface in Java',
        description: 'Which of the following best describes an interface in Java?',
        type: 'mcq', marks: 2,
        options: [
          'A class that provides a complete default implementation for all its declared methods',
          'A reference type that defines a contract of abstract methods (and constants) that implementing classes must fulfill',
          'A class that can be directly instantiated using the new keyword',
          'A keyword that prevents a class from being extended by any subclass'
        ],
        correctOption: 'B'
      },
      // Q19 — OS
      {
        title: 'Translation Lookaside Buffer (TLB)',
        description: 'What is the primary purpose of the Translation Lookaside Buffer (TLB) in an operating system?',
        type: 'mcq', marks: 2,
        options: [
          'To store the complete page table permanently inside the CPU hardware',
          'To speed up virtual-to-physical address translation by caching recently used page table entries',
          'To replace the page table entirely in modern processors',
          'To manage and track available swap space on the disk'
        ],
        correctOption: 'B'
      },
      // Q20 — System Design
      {
        title: 'Horizontal Scaling vs Vertical Scaling',
        description: 'Which of the following correctly describes horizontal scaling?',
        type: 'mcq', marks: 2,
        options: [
          'Upgrading the CPU, RAM, or storage of an existing server to a more powerful machine',
          'Adding more servers (machines) to the system and distributing the load across them',
          'Optimizing application code to reduce the number of computational operations',
          'Reducing the number of database queries by combining them into fewer, more complex queries'
        ],
        correctOption: 'B'
      },
      // Q21 — CN
      {
        title: 'Well-Known Port Numbers',
        description: 'What is the correct range for "well-known" port numbers as defined by IANA?',
        type: 'mcq', marks: 2,
        options: [
          '0 to 1023',
          '1024 to 49151',
          '49152 to 65535',
          '0 to 255'
        ],
        correctOption: 'A'
      },
      // Q22 — DBMS
      {
        title: 'Foreign Key',
        description: 'In a relational database, what is a foreign key?',
        type: 'mcq', marks: 2,
        options: [
          'A key that uniquely identifies each row in its own table',
          'A column (or set of columns) in a table that references the primary key of another table, establishing a relationship between the two tables',
          'A key that allows duplicate values and is used only in child tables',
          'A composite key that spans across multiple tables simultaneously'
        ],
        correctOption: 'B'
      },
      // Q23 — OOP
      {
        title: 'static Keyword in Java',
        description: 'Which of the following statements about the static keyword in Java is correct?',
        type: 'mcq', marks: 2,
        options: [
          'A static method can be overridden in a subclass just like an instance method',
          'A static variable is shared across all instances of the class; it belongs to the class itself, not to any individual object',
          'A static nested class cannot contain any instance methods or instance variables',
          'A static block executes every time a new object of the class is created'
        ],
        correctOption: 'B'
      },
      // Q24 — OS
      {
        title: 'Semaphore',
        description: 'In Operating Systems, a semaphore is best described as:',
        type: 'mcq', marks: 2,
        options: [
          'A special process created by the OS to manage memory allocation for user programs',
          'A synchronization primitive (variable) used to control access to shared resources and prevent race conditions',
          'A hardware mechanism used for memory protection between user and kernel space',
          'A CPU scheduling algorithm designed for real-time operating systems'
        ],
        correctOption: 'B'
      },
      // Q25 — System Design
      {
        title: 'Cache-Aside Strategy',
        description: 'In the Cache-Aside (Lazy Loading) caching strategy, what happens when a cache miss occurs?',
        type: 'mcq', marks: 2,
        options: [
          'The cache automatically fetches the data from the database and updates itself',
          'The application code fetches the data directly from the database, stores it in the cache, and then returns it to the caller',
          'The request fails with an error until the cache is manually populated by an administrator',
          'The database proactively pushes the data to the cache before any request is made'
        ],
        correctOption: 'B'
      },
      // Q26 — CN
      {
        title: 'TCP Three-Way Handshake',
        description: 'Which protocol uses a three-way handshake (SYN → SYN-ACK → ACK) to establish a connection before data transfer begins?',
        type: 'mcq', marks: 2,
        options: [
          'UDP',
          'HTTP',
          'TCP',
          'ICMP'
        ],
        correctOption: 'C'
      },
      // Q27 — DBMS
      {
        title: 'SQL View',
        description: 'Which of the following best describes a VIEW in SQL?',
        type: 'mcq', marks: 2,
        options: [
          'A physical copy of a table stored separately on disk, updated at scheduled intervals',
          'A virtual table defined by a stored SELECT query; it does not store data itself but presents it dynamically',
          'A full backup of the current database schema and its data',
          'An index created on two or more columns of a table to speed up queries'
        ],
        correctOption: 'B'
      },
      // Q28 — OOP
      {
        title: '== vs .equals() in Java',
        description: 'In Java, what is the key difference between the == operator and the .equals() method when comparing String objects?',
        type: 'mcq', marks: 2,
        options: [
          '== compares the content of two String objects; .equals() compares their memory references',
          '== compares memory references (whether two variables point to the same object); .equals() compares the actual content (character by character) of the strings',
          'Both == and .equals() always compare memory references for all object types',
          'Both == and .equals() always compare the actual content for all object types'
        ],
        correctOption: 'B'
      },
      // Q29 — OS
      {
        title: 'Thrashing',
        description: 'In the context of virtual memory management, thrashing refers to:',
        type: 'mcq', marks: 2,
        options: [
          'A condition where an excessive number of processes are waiting in the ready queue',
          'A situation where the CPU constantly preempts processes before they can complete execution',
          'A condition where a system spends more time handling page faults and swapping pages than executing actual process instructions',
          'A type of memory leak caused by the garbage collector failing to free unused objects'
        ],
        correctOption: 'C'
      },
      // Q30 — System Design
      {
        title: 'Microservice Architecture',
        description: 'Which of the following best describes a microservice architecture?',
        type: 'mcq', marks: 2,
        options: [
          'A single large application where all business logic is tightly coupled in one deployable unit',
          'An architectural style where an application is built as a collection of small, independent, and separately deployable services, each responsible for a specific business function',
          'A database architecture where data is horizontally partitioned across multiple database servers',
          'A network architecture that uses multiple load balancers to route traffic to a single backend server'
        ],
        correctOption: 'B'
      },
      // Q31 — CN
      {
        title: 'Hub vs Network Switch',
        description: 'What is the fundamental difference between a network hub and a network switch?',
        type: 'mcq', marks: 2,
        options: [
          'A hub forwards data only to the intended destination using MAC addresses; a switch broadcasts to every connected port',
          'A switch uses MAC address tables to forward data only to the specific destination port; a hub broadcasts all incoming data to every connected port',
          'A hub operates at OSI Layer 3 (Network); a switch operates at OSI Layer 2 (Data Link)',
          'Both hub and switch use IP addresses to intelligently forward data frames'
        ],
        correctOption: 'B'
      },
      // Q32 — DBMS
      {
        title: 'SQL FULL OUTER JOIN',
        description: 'Which type of SQL JOIN returns all rows from both tables, placing NULL in the columns where there is no match from either side?',
        type: 'mcq', marks: 2,
        options: [
          'INNER JOIN',
          'LEFT JOIN',
          'RIGHT JOIN',
          'FULL OUTER JOIN'
        ],
        correctOption: 'D'
      },
      // Q33 — OOP
      {
        title: 'Constructor Overloading',
        description: 'Which of the following correctly describes constructor overloading in Java?',
        type: 'mcq', marks: 2,
        options: [
          'Defining multiple constructors in the same class with the same name and the same parameter list',
          'Defining multiple constructors in the same class with the same name but different parameter lists (different number or types of parameters)',
          'A constructor in a child class that explicitly calls a method of a different class',
          'A constructor that is automatically inherited from the parent class in Java'
        ],
        correctOption: 'B'
      },
      // Q34 — OS
      {
        title: 'CPU Scheduling — Minimum Average Waiting Time',
        description: 'Which non-preemptive CPU scheduling algorithm is proven to give the minimum average waiting time for a given set of processes?',
        type: 'mcq', marks: 2,
        options: [
          'First Come First Serve (FCFS)',
          'Shortest Job First (SJF) — Non-Preemptive',
          'Round Robin (RR)',
          'Priority Scheduling'
        ],
        correctOption: 'B'
      },
      // Q35 — System Design
      {
        title: 'Message Queue',
        description: 'What is the primary benefit of using a message queue (e.g., RabbitMQ, Kafka) in a distributed system?',
        type: 'mcq', marks: 2,
        options: [
          'To process all incoming user requests synchronously in strict order',
          'To enable asynchronous communication between services and decouple the producer from the consumer',
          'To securely store and manage user authentication tokens',
          'To replace the primary database for high-traffic, write-heavy applications'
        ],
        correctOption: 'B'
      },
      // Q36 — CN
      {
        title: 'HTTPS',
        description: 'What is HTTPS?',
        type: 'mcq', marks: 2,
        options: [
          'HTTP with header compression enabled, as introduced in HTTP/2',
          'HTTP operating on port 80 with an additional authentication header',
          'HTTP secured using SSL/TLS encryption to protect data in transit',
          'A faster variant of HTTP that uses UDP instead of TCP at the transport layer'
        ],
        correctOption: 'C'
      },
      // Q37 — DBMS
      {
        title: 'Normalization',
        description: 'What is the primary goal of database normalization?',
        type: 'mcq', marks: 2,
        options: [
          'To reduce data redundancy and improve data integrity by organizing data into well-structured tables',
          'To maximize the speed of all database queries by denormalizing data',
          'To encrypt sensitive data stored in the database tables',
          'To distribute the database across multiple physical servers for improved availability'
        ],
        correctOption: 'A'
      },
      // Q38 — OOP
      {
        title: 'super() in Java',
        description: 'Which of the following statements about the super() call in Java constructors is correct?',
        type: 'mcq', marks: 2,
        options: [
          'super() is used to call a method of the current class and can be placed anywhere in the constructor',
          'super() can be placed after other statements in the constructor body',
          'super() is used to invoke the parent class constructor and must be the very first statement in the child class constructor',
          'super() directly creates and returns a new instance of the parent class'
        ],
        correctOption: 'C'
      },
      // Q39 — OS
      {
        title: 'Context Switching',
        description: 'In Operating Systems, context switching refers to:',
        type: 'mcq', marks: 2,
        options: [
          'The process of switching a program between user mode and kernel mode within the same process execution',
          'The process of saving the complete state (context) of the currently running process and then loading the previously saved state of the next process to be executed',
          'The mechanism by which a process formally requests additional memory from the operating system',
          'The technique of executing multiple threads concurrently within a single process'
        ],
        correctOption: 'B'
      },
      // Q40 — System Design
      {
        title: 'Database Sharding',
        description: 'Which of the following best describes database sharding?',
        type: 'mcq', marks: 2,
        options: [
          'Creating one or more read-only replica databases to improve read throughput',
          'Encrypting individual database tables using a shard key for security',
          'Caching the results of frequently executed database queries in an in-memory store',
          'Horizontally partitioning data across multiple independent databases based on a shard key so each shard holds a subset of the data'
        ],
        correctOption: 'D'
      },
      // Q41 — CN
      {
        title: 'NAT — Network Address Translation',
        description: 'What does Network Address Translation (NAT) do?',
        type: 'mcq', marks: 2,
        options: [
          'It translates domain names into IP addresses for internet routing',
          'It dynamically assigns IP addresses to devices when they join a network',
          'It translates private (internal) IP addresses to a public IP address so that devices in a private network can communicate with the internet',
          'It encrypts IP packets to prevent eavesdropping during transmission'
        ],
        correctOption: 'C'
      },
      // Q42 — DBMS
      {
        title: 'ER Diagram — Entity Shape',
        description: 'In an Entity-Relationship (ER) diagram, which shape is used to represent an Entity?',
        type: 'mcq', marks: 2,
        options: [
          'Diamond',
          'Ellipse (Oval)',
          'Rectangle',
          'Triangle'
        ],
        correctOption: 'C'
      },
      // Q43 — OOP
      {
        title: 'Multiple Inheritance in Java',
        description: 'Why does Java not support multiple inheritance through classes?',
        type: 'mcq', marks: 2,
        options: [
          'The Java compiler does not have the ability to process more than one parent class definition',
          'To avoid the diamond problem, where ambiguity arises if two parent classes define a method with the same name and signature',
          'Java actually supports full multiple inheritance through abstract classes',
          'Multiple inheritance is considered not useful or necessary in object-oriented design'
        ],
        correctOption: 'B'
      },
      // Q44 — OS
      {
        title: 'Zombie Process',
        description: 'In Operating Systems, a zombie process is:',
        type: 'mcq', marks: 2,
        options: [
          'A process that is currently waiting for an I/O operation to complete',
          'A process that has been killed by the OS due to a memory access violation (segfault)',
          'A process that has finished execution but its entry remains in the process table because the parent process has not yet called wait() to read its exit status',
          'A process that is consuming an abnormally high amount of CPU time and memory'
        ],
        correctOption: 'C'
      },
      // Q45 — System Design
      {
        title: 'Stateless Architecture',
        description: 'Which of the following best describes a stateless server architecture?',
        type: 'mcq', marks: 2,
        options: [
          'A server architecture where the server stores all client session data in server memory between requests',
          'An architecture where the server does not store any client-specific session state between requests; each request contains all the information needed to process it',
          'An architecture where the application serves only static HTML files without any dynamic processing',
          'An architecture where the database is stored on the client side to reduce server load'
        ],
        correctOption: 'B'
      },
      // Q46 — CN
      {
        title: 'Email Sending Protocol',
        description: 'Which protocol is specifically used for sending (outgoing) emails from a mail client to a mail server or between mail servers?',
        type: 'mcq', marks: 2,
        options: [
          'IMAP (Internet Message Access Protocol)',
          'POP3 (Post Office Protocol version 3)',
          'SMTP (Simple Mail Transfer Protocol)',
          'FTP (File Transfer Protocol)'
        ],
        correctOption: 'C'
      },
      // Q47 — DBMS
      {
        title: 'Database ROLLBACK',
        description: 'What does the ROLLBACK statement do in the context of a database transaction?',
        type: 'mcq', marks: 2,
        options: [
          'It permanently saves all changes made during the current transaction to the database',
          'It permanently deletes all rows from the specified database table',
          'It undoes all changes made during the current (uncommitted) transaction and restores the database to its state before the transaction began',
          'It creates an automatic backup of the database before any further changes are made'
        ],
        correctOption: 'C'
      },
      // Q48 — OOP
      {
        title: 'Abstract Class vs Interface in Java',
        description: 'Which of the following is a key difference between an abstract class and an interface in Java?',
        type: 'mcq', marks: 2,
        options: [
          'An abstract class can have constructors; an interface cannot have constructors',
          'An abstract class cannot contain any concrete (non-abstract) methods; an interface can',
          'A class can implement only one interface but can extend multiple abstract classes',
          'An interface cannot define any constants (static final fields); an abstract class can'
        ],
        correctOption: 'A'
      },
      // Q49 — OS
      {
        title: 'Memory Hierarchy — Fastest Storage',
        description: 'In the computer memory hierarchy, which type of memory provides the fastest access speed?',
        type: 'mcq', marks: 2,
        options: [
          'L1 Cache Memory (inside the CPU)',
          'RAM (Main Memory / DRAM)',
          'SSD (Solid State Drive)',
          'HDD (Hard Disk Drive)'
        ],
        correctOption: 'A'
      },
      // Q50 — System Design
      {
        title: 'Eventual Consistency',
        description: 'In distributed systems, which of the following best describes "eventual consistency"?',
        type: 'mcq', marks: 2,
        options: [
          'A strong consistency model where all reads always return the most recently written value immediately',
          'A consistency model that guarantees data will never be in an inconsistent state at any point in time',
          'A consistency model where, given a sufficient period without new updates, all replicas of the data will eventually converge to the same value',
          'A model where consistency is guaranteed only for write transactions but not for read operations'
        ],
        correctOption: 'C'
      },

      // Q51 — Coding Problem 1
      {
        title: 'Count Subarrays with Sum Equal to K',
        description: `Given an integer array nums and an integer k, return the total number of subarrays whose elements sum exactly to k.

A subarray is a contiguous, non-empty sequence of elements within the array.

Note: The array may contain negative numbers, zeros, and positive numbers.

---

Example 1:
Input: nums = [1, 1, 1], k = 2
Output: 2
Explanation: Subarrays [1,1] (index 0-1) and [1,1] (index 1-2) both have sum 2.

Example 2:
Input: nums = [1, 2, 3], k = 3
Output: 2
Explanation: [1,2] has sum 3 and [3] has sum 3. Total = 2.

Example 3:
Input: nums = [1, -1, 1, -1], k = 0
Output: 4
Explanation: [1,-1] (x2), [-1,1] (x1), and [1,-1,1,-1] (x1). Total = 4.

---

Constraints:
1 <= nums.length <= 2 x 10^4
-1000 <= nums[i] <= 1000
-10^7 <= k <= 10^7

C++ Function Signature:
int subarraySum(vector<int>& nums, int k)

Expected Time Complexity: O(N)
Expected Space Complexity: O(N)`,
        type: 'coding',
        marks: 15,
        inputFormat: 'Line 1: N K\nLine 2: N space-separated integers',
        outputFormat: 'Single integer — total number of subarrays with sum equal to K',
        constraints: '1 <= N <= 2x10^4, -1000 <= nums[i] <= 1000, -10^7 <= k <= 10^7',
        starterCode: `int subarraySum(vector<int>& nums, int k) {\n    // Write your solution here\n    \n}`,
        driverCode: `int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n, k;\n    if (!(cin >> n >> k)) return 0;\n    vector<int> nums(n);\n    for(int i = 0; i < n; i++) cin >> nums[i];\n    cout << subarraySum(nums, k);\n    return 0;\n}`,
        testCases: [
          { input: '3 2\n1 1 1', expectedOutput: '2', isHidden: false },
          { input: '3 3\n1 2 3', expectedOutput: '2', isHidden: false },
          { input: '4 0\n1 -1 1 -1', expectedOutput: '4', isHidden: true }
        ]
      },

      // Q52 — Coding Problem 2
      {
        title: 'Longest Consecutive Sequence',
        description: `Given an unsorted array of integers nums, return the length of the longest sequence of consecutive integers. The consecutive elements do not need to be contiguous in the original array.

Your solution must run in O(N) time complexity.

---

Example 1:
Input: nums = [100, 4, 200, 1, 3, 2]
Output: 4
Explanation: The longest consecutive sequence is [1, 2, 3, 4], which has length 4.

Example 2:
Input: nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]
Output: 9
Explanation: The longest consecutive sequence is [0,1,2,3,4,5,6,7,8], length 9. (Duplicate 0 is ignored.)

Example 3:
Input: nums = [1]
Output: 1
Explanation: Only one element, so the sequence length is 1.

---

Constraints:
0 <= nums.length <= 10^5
-10^9 <= nums[i] <= 10^9

C++ Function Signature:
int longestConsecutive(vector<int>& nums)

Expected Time Complexity: O(N)
Expected Space Complexity: O(N)`,
        type: 'coding',
        marks: 15,
        inputFormat: 'Line 1: N\nLine 2: N space-separated integers',
        outputFormat: 'Single integer — length of the longest consecutive sequence',
        constraints: '0 <= N <= 10^5, -10^9 <= nums[i] <= 10^9',
        starterCode: `int longestConsecutive(vector<int>& nums) {\n    // Write your solution here\n    \n}`,
        driverCode: `int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i = 0; i < n; i++) cin >> nums[i];\n    cout << longestConsecutive(nums);\n    return 0;\n}`,
        testCases: [
          { input: '6\n100 4 200 1 3 2', expectedOutput: '4', isHidden: false },
          { input: '10\n0 3 7 2 5 8 4 6 0 1', expectedOutput: '9', isHidden: false },
          { input: '1\n1', expectedOutput: '1', isHidden: true }
        ]
      }
    ];

    const savedQIds = [];
    for (const qData of oaQuestions) {
      await Question.deleteMany({ title: qData.title });
      const q = new Question(qData);
      await q.save();
      savedQIds.push(q._id);
    }

    const oaContest = new Contest({
      title: 'Fresher Software Engineer OA — 90 Minutes',
      description: '90-minute Fresher-level Software Engineer Online Assessment. 50 randomly mixed MCQs (Computer Networks, DBMS, OOP, Operating Systems, System Design) + 2 Medium DSA Coding Problems. Total: 52 Questions, 130 Marks.',
      durationMinutes: 90,
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      questions: savedQIds,
      isPublished: true,
      createdBy: admin._id
    });
    await oaContest.save();

    console.log('🎉 "Fresher Software Engineer OA — 90 Minutes" (52 Questions, 130 Marks) published successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
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
