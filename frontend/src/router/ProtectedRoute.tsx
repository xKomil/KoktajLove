// frontend/src/router/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner/Spinner'; // Assuming a Spinner component

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while checking auth status
    // This prevents a flicker or premature redirect if auth state is still loading
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spinner />
        <p style={{ marginLeft: '10px' }}>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // Save the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the child route component
  return <Outlet />;
};

export default ProtectedRoute;