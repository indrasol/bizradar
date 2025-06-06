import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { FilterSectionProps } from "@/models/opportunities";

const FilterSectionAutocomplete: React.FC<FilterSectionProps> = ({ title, icon, isActive, toggle, options, selectedValue, onChange }) => {

    const NAICS_CODES = [
        { code: "541511", description: "Custom Computer Programming Services" },
        { code: "541512", description: "Computer Systems Design Services" },
        { code: "541519", description: "Other Computer Related Services" },
        { code: "518210", description: "Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services" },
        { code: "541611", description: "Administrative Management and General Management Consulting Services" },
        { code: "541715", description: "Research and Development in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)" },
        // ...add more as needed
    ];

    // "541512", "541611", "541519","541715","518210"

    const [naicsSuggestions, setNaicsSuggestions] = useState([]);
    const [showNaicsDropdown, setShowNaicsDropdown] = useState(false);
    const [naicsValue, setNaicsValue] = useState('');

    const handleNaicsInputChange = (e) => {
        const value = e.target.value;
        // setFilterValues({ ...filterValues, naicsCode: value });
        setNaicsValue(value);
        let suggestions = []
        if (value.length > 0) {
            suggestions = NAICS_CODES.filter(
                (item) =>
                    item.code.startsWith(value) ||
                    item.description.toLowerCase().includes(value.toLowerCase())
            );
            setNaicsSuggestions(suggestions);
            setShowNaicsDropdown(true);
        } else {
            setNaicsSuggestions([]);
            setShowNaicsDropdown(false);
        }
        if (suggestions.length == 0) {
            onChange('');
        } else if (suggestions.length == 1) {
            onChange(value);
        }
    };

    const handleNaicsSuggestionClick = (code) => {
        onChange(code);
        setNaicsValue(code); // update input to show the selected code
        setShowNaicsDropdown(false);

        // // Only apply the filter when a suggestion is selected
        // if (hasSearched) {
        //   fetchFilteredResults({ ...filterValues, naicsCode: code });
        // }
    };

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
                    <div className="ml-7">
                        <div className="mb-2 relative">
                            <input
                                type="text"
                                placeholder="Ex: 541511"
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-gray-50"
                                value={naicsValue}
                                onChange={handleNaicsInputChange}
                                onFocus={() => {
                                    setShowNaicsDropdown(true);
                                }}
                                onBlur={() => setTimeout(() => setShowNaicsDropdown(false), 100)} // Delay to allow click
                                autoComplete="off"
                            />
                            {showNaicsDropdown && naicsSuggestions.length > 0 && (
                                <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                    {naicsSuggestions.map((item) => (
                                        <li
                                            key={item.code}
                                            className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                                            onMouseDown={() => handleNaicsSuggestionClick(item.code)}
                                        >
                                            <span className="font-medium">{item.code}</span> - {item.description}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {options &&
                            <div className="text-xs text-gray-500">
                                <p className="mb-1">Common Values:</p>
                                <ul className="space-y-1">
                                    {options.map((option) => (

                                        <li key={option.id} ><span className="font-medium">{option.value}</span> - {option.label}</li>

                                    ))}

                                </ul>
                            </div>
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterSectionAutocomplete;