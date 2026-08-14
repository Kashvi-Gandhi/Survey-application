// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import LoadingSpinner from './LoadingSpinner';

// export default function ProtectedRoute({ children, allowedRoles }) {
//   const { user, isAuthenticated, loading } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     return <LoadingSpinner />;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   if (allowedRoles && !allowedRoles.includes(user?.role)) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// }







import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
