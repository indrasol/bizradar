import React from 'react';

interface UpgradeBlockerProps {
  open: boolean;
  onUpgrade: () => void;
}

const UpgradeBlocker: React.FC<UpgradeBlockerProps> = ({ open, onUpgrade }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2147483647]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900">Your trial has ended</h2>
          <p className="text-gray-700 mt-1">Please upgrade to continue using BizRadar.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onUpgrade} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Upgrade</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeBlocker;


