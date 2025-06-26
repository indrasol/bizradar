import React from 'react';
import { ChevronRight, Power } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/Auth/useAuth';
import { toast } from 'sonner';

interface PursuitHeaderProps {
  onViewAnalytics?: () => void;
}

export const PursuitHeader: React.FC<PursuitHeaderProps> = ({ onViewAnalytics }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logging out...");
      navigate("/logout");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("There was a problem logging out");
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight size={16} className="text-gray-500" />
          <span className="font-medium text-gray-500">Pursuits</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onViewAnalytics}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-100"
          >
            <span>View Analytics</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-100 transition-colors"
          >
            <Power size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}; 