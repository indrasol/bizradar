import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radar, CheckCircle2 } from "lucide-react";

const SetupComplete: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/opportunities", { replace: true }), 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 rounded-full p-1">
              <Radar className="h-8 w-8 text-blue-600" />
            </div>
            <span className="text-2xl font-semibold text-blue-600">Bizradar</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full mx-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent transform rotate-12 rounded-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-tr from-green-50 to-transparent transform -rotate-12 rounded-xl"></div>

          <div className="text-center relative z-10">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to BizRadar!</h2>
            <p className="text-gray-600 mb-8">
              Please wait while we finish setting up your company profile and personalizing your workspace.
            </p>

            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-8 mx-auto max-w-xs">
              <div className="absolute inset-0 w-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse"></div>
            </div>

            <p className="text-sm text-gray-500">Taking you to Opportunities…</p>
          </div>
        </div>
      </div>

      <footer className="py-8 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Bizradar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SetupComplete;

