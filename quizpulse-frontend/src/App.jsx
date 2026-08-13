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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
          {/* Sticky Navigation Bar */}
          <Navbar />

          {/* Page Routing Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

              {/* Fallback Catch-All Redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}