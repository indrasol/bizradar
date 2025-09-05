import React from 'react';

interface UpgradeBlockerProps {
  open: boolean;
  onUpgrade: () => void;
  onLogout: () => void;
}

const UpgradeBlocker: React.FC<UpgradeBlockerProps> = ({ open, onUpgrade, onLogout }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Ended</h2>
          <p className="text-gray-600">
            Your trial period has ended. Please upgrade to continue using our services.
          </p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onUpgrade} 
            className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
          
          <button 
            onClick={onLogout} 
            className="w-full px-4 py-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeBlocker;


