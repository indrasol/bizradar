import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FilterSectionProps } from "@/models/opportunities";

const FilterSection: React.FC<FilterSectionProps> = ({ title, icon, isActive, toggle, options, selectedValue, onChange, onDateChange }) => {
  const isCustomDate = selectedValue === "custom_date";
  
  return (
    <div className="border-b border-gray-100">
      <div
        onClick={toggle}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="font-medium text-gray-800">{title}</h2>
        </div>
        {isActive ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>
      {isActive && (
        <div className="px-5 pb-4">
          <ul className="space-y-2 ml-7">
            {options.map((option) => (
              <li key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={title.toLowerCase().replace(" ", "-")+"_"+option.id}
                  name={title.toLowerCase().replace(" ", "-")}
                  className="accent-blue-500 w-4 h-4"
                  checked={selectedValue === option.value}
                  onChange={() => onChange(option.value)}
                />
                <label htmlFor={title.toLowerCase().replace(" ", "-")+"_"+option.id} className="text-sm text-gray-700">{option.label}</label>
              </li>
            ))}
          </ul>
          {isCustomDate && onDateChange && (
            <div className="mt-4 ml-7 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => onDateChange('from', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => onDateChange('to', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;