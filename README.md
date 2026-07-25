# ⚡ Full-Stack MERN Contest & Quiz Platform

A complete, production-ready coding contest and assessment platform built with MongoDB, Express, React, and Node.js.

---

## 🌟 Key Features

1. 🔐 **Authentication & RBAC**: JWT + bcrypt authentication for Candidates and Admins.
2. 👑 **Admin Command Center**: Create contests, configure timers, add MCQs, Bug Hunts, and Coding problems with hidden test cases.
3. 💻 **Monaco Code Editor**: VS Code-style editor for candidate coding questions.
4. ⚡ **Automated Code Judge**: Real-time test case execution engine powered by Wandbox API.
5. 🛡️ **Auto-Save & Crash-Proof**: Instant `localStorage` + background MongoDB draft sync. Page refreshes and crashes never lose progress or code!
6. 🏆 **Real-Time Leaderboard**: Automatic scoring and speed-based ranking.

---

## 📁 Directory Structure

```
mern_contest_platform/
├── server/                   # Express + Node.js Backend API
│   ├── models/               # User, Contest, Question, Submission
│   ├── routes/               # Auth, Contest, Judge, Submission APIs
│   ├── utils/                # Wandbox Judge Engine
│   └── server.js             # Main server entry point
│
└── client/                   # React (Vite) Frontend UI
    ├── src/
    │   ├── components/       # Navbar, ProtectedRoute
    │   ├── context/          # AuthContext
    │   ├── pages/            # Login, Register, Dashboard, TakeContest, CreateContest, Leaderboard
    │   └── App.jsx           # React Router
```

---

## 🚀 How to Run Locally

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*(Runs on `http://localhost:5000`)*

### 2. Start Frontend App
```bash
cd client
npm install
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 🌐 Deployment Guide (0$ Free Hosting)

### 1. Database — MongoDB Atlas
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Copy your connection string (`mongodb+srv://admin:password@cluster.mongodb.net/contest_db`).

### 2. Backend — Render.com
1. Create a Web Service pointing to `server/`.
2. Set Environment Variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = your secret key
   - `PORT` = `5000`

### 3. Frontend — Vercel
1. Connect your repo and set root directory to `client/`.
2. Vercel automatically builds and deploys your React UI!
