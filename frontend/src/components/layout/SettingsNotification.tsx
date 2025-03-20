import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SettingsNotification: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Check if we should show the notification
    const shouldShowNotification = sessionStorage.getItem('showSettingsNotification') === 'true';
    
    if (shouldShowNotification) {
      setShowNotification(true);
      
      // Remove notification if user visits settings page
      if (location.pathname.includes('/settings')) {
        sessionStorage.removeItem('showSettingsNotification');
        setShowNotification(false);
      }
    }
  }, [location.pathname]);
  
  if (!showNotification) return null;
  
  return (
    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
  );
};

export default SettingsNotification;