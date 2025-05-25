import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * ProtectedRoute component that handles authentication and role-based access control
 * @param {Object} props - Component props
 * @param {string[]} props.allowedRoles - Array of roles allowed to access the route
 * @param {string} props.redirectPath - Path to redirect to if not authenticated or not authorized
 */
const ProtectedRoute = ({ allowedRoles = [], redirectPath = '/login' }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    const userRoles = currentUser.roles || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (userRoles.includes('admin')) {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (userRoles.includes('doctor')) {
        return <Navigate to="/doctor/dashboard" replace />;
      } else {
        // Fallback to login if no recognized role
        return <Navigate to={redirectPath} replace />;
      }
    }
  }

  // If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;