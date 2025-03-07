import { X } from "lucide-react";

interface DocumentPreviewProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ content, isOpen, onClose }: DocumentPreviewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[800px] h-[90vh] rounded-lg shadow-xl flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Document Preview</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
          <div className="bg-white shadow-lg mx-auto max-w-[21cm] min-h-[29.7cm] p-8 box-border">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 