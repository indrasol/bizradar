import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Eye,
  X,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RfpResponse from '../rfp/rfpResponse';
import { useAuth } from '../Auth/useAuth';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase';
import SideBar from '../layout/SideBar';

interface SubmittedPursuit {
  id: string;
  title: string;
  stage: string;
  updated_at: string;
  is_submitted: boolean;
}

interface FollowUpNote {
  note: string;
  created_at: string;
}

interface SubmittedPursuitsWidgetProps {
  className?: string;
}

const SubmittedPursuitsWidget: React.FC<SubmittedPursuitsWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [submittedPursuits, setSubmittedPursuits] = useState<SubmittedPursuit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // RFP Builder state
  const [showRfpBuilder, setShowRfpBuilder] = useState(false);
  const [selectedPursuit, setSelectedPursuit] = useState<SubmittedPursuit | null>(null);
  
  // Fetch submitted pursuits
  const fetchSubmittedPursuits = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('trackers')
        .select('id, title, stage, updated_at, is_submitted')
        .eq('user_id', user.id)
        .eq('is_submitted', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSubmittedPursuits(data || []);
    } catch (error) {
      console.error("Error fetching submitted pursuits:", error);
      toast.error("Failed to load submitted pursuits");
      setSubmittedPursuits([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time ago helper
  const formatTimeAgo = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);

      if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
      if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      return 'just now';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  // View RFP Response for a pursuit (same as ListView renderRfpActionButton)
  const handleViewResponse = (pursuit: SubmittedPursuit) => {
    setSelectedPursuit(pursuit);
    setShowRfpBuilder(true);
  };

  // Close RFP Builder
  const closeRfpBuilder = () => {
    setShowRfpBuilder(false);
    setSelectedPursuit(null);
  };

  // Use all submitted pursuits (no filtering needed)
  const filteredPursuits = submittedPursuits;

  // Get stage color coding
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'submitted':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'under review':
        return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'awarded':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Title', 'Stage', 'Submitted Date'],
      ...filteredPursuits.map(pursuit => [
        pursuit.title,
        pursuit.stage,
        new Date(pursuit.updated_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'submitted-pursuits.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchSubmittedPursuits();
  }, [user]);

  return (
    <>
      <div className={`bg-card rounded-2xl shadow-lg border border-border overflow-hidden flex flex-col ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  RFPs Submitted
                </h2>
                <p className="text-muted-foreground text-xs">Your successful submissions</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-muted rounded-full">
              <span className="text-foreground font-medium text-sm">{filteredPursuits.length}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muted-foreground"></div>
            </div>
          ) : filteredPursuits.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No submitted pursuits yet</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Your submitted RFPs will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPursuits.map((pursuit) => {
                const stageColors = getStageColor(pursuit.stage);
                
                return (
                  <div key={pursuit.id} className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md hover:border-muted-foreground/20 transition-all duration-200 group">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-muted-foreground transition-colors line-clamp-2">
                            {pursuit.title}
                          </h3>
                          <div className="flex items-center text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3 mr-1.5" />
                            <span>Submitted {formatTimeAgo(pursuit.updated_at)}</span>
                          </div>
                        </div>
                        
                        {/* Stage Badge */}
                        <div className={`ml-3 px-3 py-1.5 rounded-full text-xs font-semibold ${stageColors.bg} ${stageColors.text} shadow-sm`}>
                          {pursuit.stage}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-xs font-bold mr-2 shadow-sm">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span className="font-medium">Successfully Submitted</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handleViewResponse(pursuit)}
                          className="px-4 py-2 bg-muted text-muted-foreground text-xs font-semibold rounded-lg hover:bg-muted-foreground hover:text-muted transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-1.5"
                          title="View RFP Response"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredPursuits.length > 0 && (
          <div className="px-6 py-4 bg-muted/20 backdrop-blur-sm border-t border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <Link
                to="/trackers?filter=submitted"
                className="text-muted-foreground hover:text-foreground text-sm font-semibold inline-flex items-center group"
              >
                View all submitted RFPs
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={handleExportCSV}
                className="text-muted-foreground hover:text-foreground text-sm font-medium inline-flex items-center hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RFP Builder Modal - same as in Pursuits.tsx */}
      {showRfpBuilder && selectedPursuit && (
        <div className="fixed inset-0 bg-gray-50 z-[10001] flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            <SideBar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="sticky top-0 z-10 p-4 border-b flex justify-between items-center bg-white flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold">RFP Response Builder</h2>
                <button
                  onClick={closeRfpBuilder}
                  className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <RfpResponse 
                  contract={selectedPursuit} 
                  pursuitId={selectedPursuit.id} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubmittedPursuitsWidget;
