import React, { useState } from "react";
import { Clock, Calendar, Tag, ListFilter, ChevronLeft, SlidersHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import FilterSection from "./FilterSection";
import { FiltersSidebarProps } from "@/models/opportunities";
import FilterSectionAutocomplete from "./FilterSectionAutoComplete";

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({ filterValues, setFilterValues, applyFilters }) => {
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState({
    dueDate: true,
    postedDate: true,
    naicsCode: true,
    opportunityType: true,
  });

  const toggleFilter = (filter: keyof typeof activeFilters) => {
    setActiveFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setFilterValues({ ...filterValues, customPostedDateFrom: value });
    } else {
      setFilterValues({ ...filterValues, customPostedDateTo: value });
    }
  };

  return (
    <div className={`border-r border-gray-200 overflow-y-auto relative bg-white shadow-sm transition-all duration-300 ease-in-out ${filtersOpen ? "w-72" : "w-16"}`}>
      <div className="sticky top-0 z-10 p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        {filtersOpen && <h2 className="font-semibold text-lg text-gray-800">Filters</h2>}
        <button
          className={`rounded-full flex items-center justify-center transition-all duration-300 ${filtersOpen ? "ml-auto bg-gray-100 hover:bg-gray-200 w-8 h-8" : "bg-blue-50 hover:bg-blue-100 text-blue-600 w-10 h-10 border border-blue-200"}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          {filtersOpen ? <ChevronLeft size={16} className="text-gray-600" /> : <SlidersHorizontal size={18} className="text-blue-600" />}
        </button>
      </div>
      {filtersOpen ? (
        <>
          <FilterSection
            title="Due Date"
            icon={<Clock size={18} className="text-blue-500" />}
            isActive={activeFilters.dueDate}
            toggle={() => toggleFilter("dueDate")}
            options={[
              { id: "none", value: "none", label: "None" },
              { id: "active-only", value: "active_only", label: "Active only" },
              { id: "due-in-7", value: "due_in_7_days", label: "Next 7 days" },
              { id: "next-30", value: "next_30_days", label: "Next 30 days" },
              { id: "next-3", value: "next_3_months", label: "Next 3 months" },
              { id: "next-12", value: "next_12_months", label: "Next 12 months" },
            ]}
            selectedValue={filterValues.dueDate}
            onChange={(value) => setFilterValues({ ...filterValues, dueDate: value })}
          />
          <FilterSection
            title="Posted Date"
            icon={<Calendar size={18} className="text-gray-500" />}
            isActive={activeFilters.postedDate}
            toggle={() => toggleFilter("postedDate")}
            options={[
              { id: "all", value: "all", label: "All dates" },
              { id: "past-day", value: "past_day", label: "Past day" },
              { id: "past-week", value: "past_week", label: "Past week" },
              { id: "past-month", value: "past_month", label: "Past month" },
              { id: "past-year", value: "past_year", label: "Past year" },
              { id: "custom-date-posted", value: "custom_date", label: "Custom date" },
            ]}
            selectedValue={filterValues.postedDate}
            onChange={(value) => setFilterValues({ ...filterValues, postedDate: value })}
            onDateChange={handleDateChange}
          />
          {/* Add NAICS Code and Opportunity Type filters similarly */}
          <FilterSectionAutocomplete
            title="NAICS Code"
            icon={<Calendar size={18} className="text-gray-500" />}
            isActive={activeFilters.naicsCode}
            toggle={() => toggleFilter("naicsCode")}
            options={[
              { id: "541511", value: "541511", label: "Custom Computer Programming Services" },
              { id: "541512", value: "541512", label: "Computer Systems Design Services" },
            ]}
            selectedValue={filterValues.naicsCode}
            onChange={(value) => setFilterValues({ ...filterValues, naicsCode: value })}
          />
          <FilterSection
            title="Opportunity Type"
            icon={<Calendar size={18} className="text-gray-500" />}
            isActive={activeFilters.opportunityType}
            toggle={() => toggleFilter("opportunityType")}
            options={[
              { id: "all", value: "all", label: "All" },
              { id: "federal", value: "federal", label: "Federal (SAM.gov)" },
            ]}
            selectedValue={filterValues.opportunityType}
            onChange={(value) => setFilterValues({ ...filterValues, opportunityType: value })}
          />
          <div className="p-4">
            <button
              onClick={applyFilters}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ListFilter size={16} />
              <span>Apply Filters</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center p-3 gap-3">
          <div className="group relative">
            <button 
              className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
              onClick={() => toggleFilter("dueDate")}
              title="Due Date Filter"
            >
              <Clock size={18} />
            </button>
          </div>
          <div className="group relative">
            <button 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => toggleFilter("postedDate")}
              title="Posted Date Filter"
            >
              <Calendar size={18} />
            </button>
          </div>
          <div className="group relative">
            <button 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => toggleFilter("naicsCode")}
              title="NAICS Code Filter"
            >
              <Tag size={18} />
            </button>
          </div>
          <div className="group relative">
            <button 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => toggleFilter("opportunityType")}
              title="Opportunity Type Filter"
            >
              <ListFilter size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersSidebar;