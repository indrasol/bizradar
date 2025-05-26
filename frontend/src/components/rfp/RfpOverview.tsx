import React, { useEffect } from 'react';
import { 
  ExternalLink, 
  FileText, 
  Building, 
  Calendar, 
  Tag, 
  Hash, 
  Clock, 
  Sparkles, 
  Download,
  ChevronRight,
  Users,
  AlertCircle,
  DollarSign
} from 'lucide-react';

export function RfpOverview({
  title = "Not specified",
  department = "Not specified",
  dueDate = "Not specified",
  status = "Draft",
  naicsCode = "Not specified",
  description = "No description available",
  solicitation_number = "Not specified",
  published_date = "Not specified",
  budget="Not specified",
  onViewDescription,
  onGenerateResponse,
  onGenerateRfp 
}) {
  // Add debugging to verify props are received
  useEffect(() => {
    console.log("RfpOverview received props:", {
      title,
      department,
      dueDate,
      status,
      naicsCode,
      description: description ? (description.length > 50 ? description.substring(0, 50) + "..." : description) : "None",
      solicitation_number,
      published_date,
      budget
    });
  }, [title, department, dueDate, status, naicsCode, description, solicitation_number, published_date]);

  // Function to get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'draft':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          icon: '#EBF5FF', 
          border: 'border-blue-100'
        };
      case 'open':
      case 'active':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-600',
          icon: '#ECFDF5',
          border: 'border-emerald-100'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          icon: '#F9FAFB',
          border: 'border-gray-100'
        };
    }
  };

  const statusColor = getStatusColor(status);
  
  // Function to determine if due date is soon (within 7 days)
  const isDueDateSoon = () => {
    if (dueDate === "Not specified" || dueDate === "TBD") return false;
    
    try {
      const dueDateObj = new Date(dueDate);
      const today = new Date();
      const diffTime = dueDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="max-w-9xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all hover:shadow-xl">
      {/* Header with title and status */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-white p-8 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="mr-3 p-2 bg-blue-100 rounded-xl shadow-sm">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">RFP Overview</h2>
          </div>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-sm ${statusColor.bg} ${statusColor.text} ${statusColor.border} border transition-all`}>
            <span className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: statusColor.text }}></span>
            {status}
          </div>
        </div>
        
        {/* Title section with enhanced styling */}
        <div className="mt-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
          
          {/* Quick stats row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-gray-400" />
              <span>{department}</span>
            </div>
            
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-gray-400" />
              <span>NAICS: {naicsCode}</span>
            </div>
            
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            
            <div className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-gray-400" />
              <span>#{solicitation_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Details</h4>
            
            <div className="space-y-6">
              {/* Department section with enhanced card */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg shadow-sm mt-1">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                    <p className="text-lg font-medium text-gray-800">{department}</p>
                  </div>
                </div>
              </div>
              
              {/* Due Date section with alert for soon-to-expire */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className={`p-3 ${isDueDateSoon() ? 'bg-amber-100' : 'bg-green-100'} rounded-lg shadow-sm mt-1`}>
                    <Calendar className={`w-5 h-5 ${isDueDateSoon() ? 'text-amber-600' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Due Date</p>
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-800">{dueDate}</p>
                      {isDueDateSoon() && (
                        <div className="ml-3 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Due soon
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Published Date */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg shadow-sm mt-1">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Published Date</p>
                    <p className="text-lg font-medium text-gray-800">{published_date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Classification</h4>
            
            <div className="space-y-6">
              {/* NAICS Code */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg shadow-sm mt-1">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">NAICS Code</p>
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-800">{naicsCode}</p>
                      <div className="ml-3 flex items-center text-sm text-gray-500">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        <a href={`https://www.naics.com/search/?code=${naicsCode}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                          View details
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-indigo-100 rounded-lg shadow-sm mt-1">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Funding</p>
                    <p className="text-lg font-medium text-gray-800">{budget|| "Not specified"}</p>
                  </div>
                </div>
              </div>
              {/* Solicitation Number */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-indigo-100 rounded-lg shadow-sm mt-1">
                    <Hash className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Solicitation Number</p>
                    <p className="text-lg font-medium text-gray-800">{solicitation_number}</p>
                  </div>
                </div>
              </div>
              
              {/* Related Opportunities or Team */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-teal-100 rounded-lg shadow-sm mt-1">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Assigned Team</p>
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">TJ</div>
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">KL</div>
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">RB</div>
                      </div>
                      <button className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons with enhanced styling */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-8 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          <button 
            onClick={onViewDescription}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow"
          >
            <ExternalLink className="w-5 h-5 text-gray-500" />
            <span className="font-sans">View Complete Description</span>
          </button>
          
          <button 
            onClick={onGenerateResponse}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-green-200" />
            <span className="font-sans tracking-tight">View Sample RFP Response</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
          
          <button 
            onClick={onGenerateRfp}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Download className="w-5 h-5 text-blue-200" />
            <span className="font-sans tracking-tight">Generate RFP Response</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}











