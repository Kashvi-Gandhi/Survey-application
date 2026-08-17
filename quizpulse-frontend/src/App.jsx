import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Import All Page Components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuestionBanks from './pages/QuestionBanks';
import CreateSurvey from './pages/CreateSurvey';
import TakeSurvey from './pages/TakeSurvey';
import Analytics from './pages/Analytics';
import EditSurvey from './pages/EditSurvey';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-[#EAEFEF] via-[#E2E9F0] to-[#E2E8F0] text-slate-900 flex flex-col font-sans antialiased">
          {/* Sticky Navigation Bar - Floating Card */}
          <Navbar />

          {/* Page Routing Container - Canvas with Padding */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Public Unauthenticated Survey Taking Route */}
                <Route path="/survey/:id" element={<TakeSurvey />} />

                {/* Protected User Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Surveyor Routes */}
                <Route
                  path="/banks"
                  element={
                    <ProtectedRoute allowedRoles={['surveyor', 'admin']}>
                      <QuestionBanks />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/create-survey"
                  element={
                    <ProtectedRoute allowedRoles={['surveyor', 'admin']}>
                      <CreateSurvey />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/analytics/:id"
                  element={
                    <ProtectedRoute allowedRoles={['surveyor', 'admin']}>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/surveys/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['surveyor', 'admin']}>
                      <EditSurvey />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback Catch-All Redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
