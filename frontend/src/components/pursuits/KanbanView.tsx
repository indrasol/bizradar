import React from 'react';
import { Bot, PenLine, CheckCircle, Trash2 } from 'lucide-react';
import { Pursuit } from './types';

interface KanbanViewProps {
  pursuits: Pursuit[];
  onPursuitSelect: (pursuit: Pursuit) => void;
  onRfpAction: (pursuit: Pursuit) => void;
  onDelete: (id: string) => void;
  onAskAI: (pursuit: Pursuit) => void;
}

const STAGES = [
  { id: 'Assessment', title: 'Assessment', color: 'bg-orange-100 text-orange-800' },
  { id: 'Planning', title: 'Planning', color: 'bg-blue-100 text-blue-800' },
  { id: 'Implementation', title: 'Implementation', color: 'bg-purple-100 text-purple-800' },
  { id: 'Review', title: 'Review', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'RFP Response Completed', title: 'Completed', color: 'bg-green-100 text-green-800' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  pursuits,
  onPursuitSelect,
  onRfpAction,
  onDelete,
  onAskAI,
}) => {
  const getPursuitsForStage = (stageId: string) => {
    return pursuits.filter(pursuit => pursuit.stage === stageId);
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
    <div className="flex gap-4 p-4 overflow-x-auto">
      {STAGES.map((stage) => (
        <div
          key={stage.id}
          className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-medium ${stage.color}`}>{stage.title}</h3>
            <span className="text-xs text-gray-500">
              {getPursuitsForStage(stage.id).length}
            </span>
          </div>
          
          <div className="space-y-3">
            {getPursuitsForStage(stage.id).map((pursuit) => (
              <div
                key={pursuit.id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 transition-colors cursor-pointer"
                onClick={() => onPursuitSelect(pursuit)}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm text-gray-900">{pursuit.title}</h4>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAI(pursuit);
                      }}
                      className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-all"
                      title="Ask BizRadar AI"
                    >
                      <Bot size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pursuit.id);
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all"
                      title="Delete Pursuit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {pursuit.description}
                </p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Due: {pursuit.dueDate}
                  </div>
                  {renderRfpActionButton(pursuit)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 