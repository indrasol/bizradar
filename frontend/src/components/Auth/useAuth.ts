import { useContext } from 'react';
import AuthContext from './AuthContext';

/**
 * Hook to access authentication context
 * @returns Authentication context with user data and functions
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};