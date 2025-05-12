// Create a file called src/components/ProtectedRoute.jsx

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, refreshAuthToken } from '../utils/api';

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        // Try to refresh token to ensure it's still valid
        const refreshed = await refreshAuthToken();
        setIsAuth(refreshed || isAuthenticated());
      } else {
        setIsAuth(false);
      }
      setIsChecking(false);
    };
    
    checkAuth();
  }, []);
  
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;