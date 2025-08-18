import { Radar } from 'lucide-react';
import React from 'react';

interface TrialStatusModalProps {
  open: boolean;
  remainingDays: number;
  isTrial: boolean;
  onUpgrade: () => void;
  onClose?: () => void;
}

const TrialStatusModal: React.FC<TrialStatusModalProps> = ({ open, remainingDays, isTrial, onUpgrade, onClose }) => {
  if (!open) return null;

  const daysText = remainingDays > 0 ? `${remainingDays} day${remainingDays === 1 ? '' : 's'} left` : 'Less than 24 hours left';

  return (
    <div className="fixed inset-0 z-[2147483646]">
      {/* Ambient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-indigo-900/50 to-cyan-900/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Decorative glow */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg relative">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 text-white">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
              <div className="relative flex items-start gap-4">
                <div className="shrink-0 h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg ring-1 ring-white/70">
                  <Radar className="w-7 h-7 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Your BizRadar trial is active</h2>
                  <p className="text-white/90 text-sm mt-1">Full access unlocked. Make the most of it!</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                    {daysText}
                  </span>
                  {isTrial && (
                    <span className="text-xs text-gray-500">Upgrade anytime to avoid interruptions</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-gray-400 tracking-wider">Status</div>
                  <div className="text-sm font-semibold text-emerald-600">Active Trial</div>
                </div>
              </div>

              {/* Perks */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="text-blue-600">✨</div>
                  <div className="text-sm text-gray-700">AI-powered opportunity summaries and insights</div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="text-blue-600">📈</div>
                  <div className="text-sm text-gray-700">Smart recommendations, tailored to your profile</div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="text-blue-600">⚡</div>
                  <div className="text-sm text-gray-700">Faster search with refined queries</div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="text-blue-600">🧩</div>
                  <div className="text-sm text-gray-700">Keep everything you create when you upgrade</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Continue exploring
                  </button>
                )}
                <button
                  onClick={onUpgrade}
                  className="px-5 py-2.5 rounded-lg text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 shadow-sm hover:shadow-md transition-all font-medium"
                >
                  Upgrade now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialStatusModal;


