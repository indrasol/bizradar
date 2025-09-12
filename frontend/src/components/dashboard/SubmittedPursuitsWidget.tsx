import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  ChevronRight,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/useAuth';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase';

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
  
  // Follow-up modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpPursuit, setFollowUpPursuit] = useState<SubmittedPursuit | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState<FollowUpNote[]>([]);
  const [newFollowUpNote, setNewFollowUpNote] = useState("");

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

  // Handle follow up modal
  const handleFollowUp = async (pursuit: SubmittedPursuit) => {
    setFollowUpPursuit(pursuit);
    setShowFollowUpModal(true);
    setNewFollowUpNote("");
    
    if (!user) {
      setFollowUpNotes([]);
      return;
    }
    
    const { data, error } = await supabase
      .from("tracker_followup_notes")
      .select("note, created_at")
      .eq("tracker_id", pursuit.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
      
    if (error) {
      setFollowUpNotes([]);
    } else {
      setFollowUpNotes(data || []);
    }
  };

  // Save new follow-up note
  const handleSaveFollowUpNote = async () => {
    if (!newFollowUpNote.trim() || !user || !followUpPursuit) return;
    
    const noteText = newFollowUpNote.trim();
    const { data, error } = await supabase
      .from("tracker_followup_notes")
      .insert({
        tracker_id: followUpPursuit.id,
        user_id: user.id,
        note: noteText,
      });
      
    if (!error) {
      setFollowUpNotes([{ note: noteText, created_at: new Date().toISOString() }, ...followUpNotes]);
      setNewFollowUpNote("");
    }
  };

  useEffect(() => {
    fetchSubmittedPursuits();
  }, [user]);

  return (
    <>
      <div className={`bg-card p-6 rounded-xl shadow-md border border-border transition-all hover:shadow-lg flex flex-col ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-blue-500" />
            RFPs Submitted
          </h2>
          <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {submittedPursuits.length}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-3">
              {submittedPursuits.map((pursuit) => (
                <div key={pursuit.id} className="rounded-lg border border-border p-4 hover:shadow-sm transition-all group">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-2 bg-green-100 text-green-600 rounded-lg mr-3">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-md font-medium text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                        {pursuit.title}
                      </h3>
                      <div className="mb-2 flex items-center text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full w-fit">
                        <Clock className="h-3 w-3 mr-1 text-green-500" />
                        <span>
                          {`Submitted ${formatTimeAgo(pursuit.updated_at)}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          Pursuit
                        </span>
                        <span>•</span>
                        <span>{pursuit.stage}</span>
                      </div>
                    </div>
                    <button
                      className="ml-2 p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                      title="Follow up"
                      onClick={() => handleFollowUp(pursuit)}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {submittedPursuits.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No submitted pursuits yet
                </div>
              )}
            </div>

            {submittedPursuits.length > 0 && (
              <div className="pt-4 text-center border-t border-gray-100 flex-shrink-0">
                <Link
                  to="/pursuits?filter=submitted"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                >
                  View all submitted pursuits
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow-up Modal */}
      {showFollowUpModal && followUpPursuit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Follow Up on: {followUpPursuit.title}
              </h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                placeholder="Add your follow-up note here..."
                className="w-full p-2 border-b border-gray-200 text-sm mb-4 focus:outline-none focus:border-blue-500 min-h-24"
                value={newFollowUpNote}
                onChange={e => setNewFollowUpNote(e.target.value)}
              ></textarea>
              <button
                onClick={handleSaveFollowUpNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full mb-4"
              >
                Save Note
              </button>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Previous Follow-ups</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {followUpNotes.length === 0 ? (
                    <div className="text-gray-400 text-sm">No follow-up notes yet.</div>
                  ) : (
                    <ul>
                      {followUpNotes.map((note, idx) => (
                        <li key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">{new Date(note.created_at).toLocaleString()}</div>
                          <div className="text-gray-800 text-sm">{note.note}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubmittedPursuitsWidget;
