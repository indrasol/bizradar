import React, { useRef, useState } from 'react';
import { X, FileText } from 'lucide-react';
import { Opportunity } from './types';

interface CreatePursuitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePursuit: (pursuit: {
    title: string;
    description: string;
    stage: string;
    due_date: string | null;
    tags: string[];
  }) => void;
}

export const CreatePursuitDialog: React.FC<CreatePursuitDialogProps> = ({
  isOpen,
  onClose,
  onCreatePursuit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newPursuit, setNewPursuit] = useState({
    title: "",
    description: "",
    stage: "Assessment",
    due_date: null as string | null,
    tags: [] as string[],
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    onCreatePursuit(newPursuit);
    onClose();
    // Reset form
    setNewPursuit({
      title: "",
      description: "",
      stage: "Assessment",
      due_date: null,
      tags: [],
    });
    setSelectedFiles([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative">
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Import Pursuit
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="p-6">
          {/* Title Input */}
          <input
            type="text"
            placeholder="Pursuit title"
            className="w-full p-2 border-b border-gray-200 text-lg font-medium mb-4 focus:outline-none focus:border-blue-500"
            value={newPursuit.title}
            onChange={(e) =>
              setNewPursuit({ ...newPursuit, title: e.target.value })
            }
          />

          {/* Description Input */}
          <textarea
            placeholder="Add description..."
            className="w-full p-2 border-b border-gray-200 text-sm mb-6 focus:outline-none focus:border-blue-500 min-h-24"
            value={newPursuit.description}
            onChange={(e) =>
              setNewPursuit({ ...newPursuit, description: e.target.value })
            }
          ></textarea>

          {/* Tags and Options */}
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Federal Contract Button */}
            <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50">
              Federal Contract
            </button>

            {/* Assessment Tag */}
            <div className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm flex items-center gap-1 font-medium">
              <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
              Assessment
            </div>

            {/* No Assignee Tag */}
            <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-1">
              <span className="text-gray-500">👤</span>
              No assignee
            </button>

            {/* Date Picker */}
            <input
              type="date"
              className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50"
              onChange={(e) =>
                setNewPursuit({ ...newPursuit, due_date: e.target.value })
              }
            />

            {/* Select Tags */}
            <button className="px-3 py-1.5 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50">
              + Select tags
            </button>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">
              Add Solicitation Files
            </h4>
            <div
              className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              {selectedFiles.length === 0 ? (
                <>
                  <FileText className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center">
                    Drag and drop files here
                    <br />
                    <span className="text-blue-500">
                      or browse for files
                    </span>
                  </p>
                </>
              ) : (
                <div className="w-full">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 truncate max-w-xs">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-700"
          >
            Import Pursuit
          </button>
        </div>
      </div>
    </div>
  );
}; 