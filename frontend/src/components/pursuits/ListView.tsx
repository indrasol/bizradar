import React from 'react';
import { Bot, PenLine, CheckCircle, Trash2, CheckSquare } from 'lucide-react';
import { Pursuit } from './types';

interface ListViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
  onRfpAction: (pursuit: Pursuit) => void;
  onDelete: (id: string) => void;
  onAskAI: (pursuit: Pursuit) => void;
  onToggleSubmission: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
  onToggleSubmission,
}) => {
  const internalRef = React.useRef<HTMLDivElement>(null);

  const getStageColor = (stage: string): string => {
    if (stage.includes("RFP Response Initiated")) {
      return "bg-yellow-100 text-yellow-800";
    }
    
    switch(stage) {
      case "Assessment":
        return "bg-orange-100 text-orange-800";
      case "Planning":
        return "bg-blue-100 text-blue-800";
      case "Implementation":
        return "bg-purple-100 text-purple-800";
      case "Review":
        return "bg-indigo-100 text-indigo-800";
      case "RFP Response Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderRfpActionButton = (pursuit: Pursuit) => {
    let buttonText = "Create Response";
    let icon = <PenLine className="w-3 h-3" />;
    
    if (pursuit.is_submitted) {
      buttonText = "View Submitted";
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (pursuit.stage === "RFP Response Completed") {
      buttonText = "Edit Response";
      icon = <PenLine className="w-3 h-3" />;
    } else if (pursuit.stage.includes("RFP Response Initiated")) {
      buttonText = "Continue Response";
      icon = <PenLine className="w-3 h-3" />;
    }
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRfpAction(pursuit);
        }}
        className="ml-2 px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-1"
      >
        {icon} {buttonText}
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pursuit
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {pursuits.map((pursuit, index) => (
              <tr 
                key={pursuit.id} 
                className={`group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                onClick={() => onPursuitSelect(pursuit)}
              >
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {pursuit.title}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(pursuit.stage)}`}>
                    {pursuit.stage}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pursuit.created}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-red-600 font-medium">
                    {pursuit.dueDate !== "TBD" ? pursuit.dueDate : "No Due Date Set"}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                  {pursuit.is_submitted ? (
                    <CheckSquare className="w-5 h-5 text-green-600 mx-auto" />
                  ) : pursuit.stage === "RFP Response Completed" ? (
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSubmission(pursuit.id);
                        }}
                        className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors"
                        title="Mark as submitted"
                      >
                        <div className="w-3 h-3 rounded"></div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center tooltip relative">
                      <div className="w-5 h-5 border border-gray-200 rounded bg-gray-100 opacity-60 cursor-not-allowed"></div>
                      <div className="tooltip-text opacity-0 group-hover:opacity-100 absolute mt-8 -translate-x-1/2 left-1/2 p-2 bg-gray-800 text-white text-xs rounded w-48 transition-all pointer-events-none">
                        Please complete the RFP before submitting
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAI(pursuit);
                      }}
                      className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                      title="Ask BizRadar AI"
                    >
                      <Bot size={18} />
                    </button>
                    
                    {renderRfpActionButton(pursuit)}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pursuit.id);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete Pursuit"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 