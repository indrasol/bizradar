import React, { useEffect } from 'react';
import { ExternalLink, FileText, Building, Calendar, Tag, Hash, Clock, Sparkles, Download } from 'lucide-react';

export function RfpOverview({
  title = "Not specified",
  department = "Not specified",
  dueDate = "Not specified",
  status = "Draft",
  naicsCode = "Not specified",
  description = "No description available",
  solicitation_number = "Not specified",
  published_date = "Not specified",
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
      published_date
    });
  }, [title, department, dueDate, status, naicsCode, description, solicitation_number, published_date]);

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header with title and status */}
      <div className="bg-gradient-to-r from-blue-50 to-white p-8 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">RFP Overview</h2>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm"
               style={{
                 backgroundColor: status?.toLowerCase() === 'draft' ? '#EFF6FF' : 
                                status?.toLowerCase() === 'open' || status?.toLowerCase() === 'active' ? '#ECFDF5' :
                                '#F9FAFB',
                 color: status?.toLowerCase() === 'draft' ? '#2563EB' : 
                        status?.toLowerCase() === 'open' || status?.toLowerCase() === 'active' ? '#059669' :
                        '#4B5563'
               }}>
            {status}
          </div>
        </div>
        
        {/* Title section */}
        <div className="mt-4 mb-6">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <FileText className="w-5 h-5" />
            <p className="text-sm font-medium">Title</p>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 pl-7">{title}</h3>
        </div>
      </div>

      {/* Main content */}
      <div className="p-8">
        {/* Department section */}
        <div className="mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg shadow-sm mt-1">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Department</p>
              <p className="text-lg text-gray-800">{department}</p>
            </div>
          </div>
        </div>

        {/* Grid layout for remaining info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg shadow-sm mt-1">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Due Date</p>
                <p className="text-lg text-gray-800">{dueDate}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg shadow-sm mt-1">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Published Date</p>
                <p className="text-lg text-gray-800">{published_date}</p>
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-8">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg shadow-sm mt-1">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">NAICS Code</p>
                <p className="text-lg text-gray-800">{naicsCode}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg shadow-sm mt-1">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Solicitation Number</p>
                <p className="text-lg text-gray-800">{solicitation_number}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="bg-gray-50 p-8 border-t border-gray-200">
        <div className="flex flex-wrap gap-8 justify-center">
          <button 
            onClick={onViewDescription}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5 text-gray-500" />
            <span className="font-sans">View Complete Description</span>
          </button>
          
          <button 
            onClick={onGenerateResponse}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-green-200" />
            <span className="font-sans tracking-tight">View Sample RFP Response</span>
          </button>
          
          <button 
            onClick={onGenerateRfp}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center gap-2"
          >
            <Download className="w-5 h-5 text-blue-200" />
            <span className="font-sans tracking-tight">Generate RFP Response</span>
          </button>
        </div>
      </div>
    </div>
  );
}