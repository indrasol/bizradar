import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that redirects unauthenticated users
 * Can be used to wrap routes that require authentication
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirection after login
    const currentPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    return <Navigate to={redirectTo} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;