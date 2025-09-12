import React from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';

interface ConditionalThemeProviderProps {
  children: React.ReactNode;
}

const ConditionalThemeProvider: React.FC<ConditionalThemeProviderProps> = ({ children }) => {
  const location = useLocation();
  
  // Define public routes that should always use light theme
  const publicRoutes = [
    '/',
    '/login',
    '/signup', 
    '/register',
    '/forgot-password',
    '/reset-password',
    '/terms',
    '/privacy',
    '/contracts' // This might be public based on your App.tsx
  ];
  
  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  return (
    <ThemeProvider disableThemeToggle={isPublicRoute}>
      {children}
    </ThemeProvider>
  );
};

export default ConditionalThemeProvider;
