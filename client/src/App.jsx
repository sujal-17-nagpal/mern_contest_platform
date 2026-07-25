import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import CandidateDashboard from './pages/CandidateDashboard';
import TakeContest from './pages/TakeContest';
import CreateContest from './pages/CreateContest';
import AdminReview from './pages/AdminReview';
import CandidateReview from './pages/CandidateReview';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <CandidateDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/contest/:id" element={
              <ProtectedRoute>
                <TakeContest />
              </ProtectedRoute>
            } />

            <Route path="/contest-result/:id" element={
              <ProtectedRoute>
                <CandidateReview />
              </ProtectedRoute>
            } />

            <Route path="/admin/create-contest" element={
              <ProtectedRoute adminOnly={true}>
                <CreateContest />
              </ProtectedRoute>
            } />

            <Route path="/admin/edit-contest/:id" element={
              <ProtectedRoute adminOnly={true}>
                <CreateContest />
              </ProtectedRoute>
            } />

            <Route path="/admin/review/:id" element={
              <ProtectedRoute adminOnly={true}>
                <AdminReview />
              </ProtectedRoute>
            } />

            <Route path="/leaderboard/:id" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
