import { FileText, Building, Calendar, DollarSign, Tag, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RfpOverviewProps {
  title?: string;
  agency?: string;
  dueDate?: string;
  value?: number;
  status?: string;
  naicsCode?: string;
  description?: string;
  onViewDescription: () => void;
  onGenerateResponse: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export function RfpOverview({
  title = "Not specified",
  agency = "Not specified",
  dueDate = "Not specified",
  value = 0,
  status = "Draft",
  naicsCode = "Not specified",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  onViewDescription,
  onGenerateResponse,
  onToggleChat,
  isChatOpen
}: RfpOverviewProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-gray-200">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">RFP Overview</h2>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm"
             style={{
               backgroundColor: status.toLowerCase() === 'draft' ? '#EFF6FF' : '#F0FDF4',
               color: status.toLowerCase() === 'draft' ? '#2563EB' : '#16A34A'
             }}>
          {status}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 bg-blue-50 rounded-full shadow-sm">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Title</p>
              <p className="font-medium">{title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 bg-blue-50 rounded-full shadow-sm">
              <Building className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Agency</p>
              <p className="font-medium">{agency}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 bg-blue-50 rounded-full shadow-sm">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">{dueDate}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 bg-blue-50 rounded-full shadow-sm">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Value</p>
              <p className="font-medium">
                {value ? `$${value.toLocaleString()}` : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <div className="p-2 bg-blue-50 rounded-full shadow-sm">
              <Tag className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">NAICS Code</p>
              <p className="font-medium">{naicsCode}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t flex flex-wrap gap-4 justify-center">
        <Button
          size="lg"
          onClick={onViewDescription}
          className="min-w-[200px] shadow-sm bg-green-500 hover:bg-green-600 text-white"
        >
          View Complete Description
        </Button>
        <Button
          size="lg"
          onClick={onGenerateResponse}
          className="min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          Generate RFP Response
        </Button>
        <Button
          size="lg"
          onClick={onToggleChat}
          className={`shadow-sm flex items-center gap-2 ${
            isChatOpen 
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isChatOpen ? (
            <>
              <X className="w-4 h-4" />
              Hide Bizradar AI
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Ask Bizradar AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
}