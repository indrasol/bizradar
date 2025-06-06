export interface SuggestedQuery {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export interface ResultsListProps {
  opportunities: Opportunity[];
  isSearching: boolean;
  hasSearched: boolean;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => Promise<void>;
  handleAddToPursuit: (opportunity: Opportunity) => Promise<void>;
  handleBeginResponse: (contractId: string, contractData: Opportunity) => void;
  handleViewDetails: (opportunity: Opportunity) => void;
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  expandedDescriptions: Record<string, boolean>;
  setExpandedDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  refinedQuery: string;
  handleSuggestedQueryClick: (query: string) => void;
}

export interface SuggestedSearchesProps {
  suggestedQueries: SuggestedQuery[];
  handleSuggestedQueryClick: (query: string) => void;
}

export interface ScrollToTopButtonProps {
  isVisible: boolean;
  scrollToTop: () => void;
}

export interface PaginationProps {
  hasSearched: boolean;
  isSearching: boolean;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => Promise<void>;
}

export interface NotificationToastProps {
  show: boolean;
}

export interface OpportunityCardProps {
  opportunity: Opportunity;
  handleAddToPursuit: (opportunity: Opportunity) => Promise<void>;
  handleBeginResponse: (contractId: string, contractData: Opportunity) => void;
  handleViewDetails: (opportunity: Opportunity) => void;
  toggleDescription: () => void;
  isExpanded: boolean;
  refinedQuery: string;
}

export interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  toggle: () => void;
  options: FilterSectionOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export interface FilterSectionOption {
  id: string;
  value: string;
  label: string;
}

export interface FiltersSidebarProps {
  filterValues: FilterValues;
  setFilterValues: React.Dispatch<React.SetStateAction<FilterValues>>;
  applyFilters: () => Promise<void>;
}

export interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent | null, suggestedQuery?: string | null) => Promise<void>;
  clearSearch: () => void;
}

export interface MainContentProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent | null, suggestedQuery?: string | null) => Promise<void>;
  clearSearch: () => void;
  filterValues: FilterValues;
  setFilterValues: React.Dispatch<React.SetStateAction<FilterValues>>;
  opportunities: Opportunity[];
  isSearching: boolean;
  hasSearched: boolean;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => Promise<void>;
  handleAddToPursuit: (opportunity: Opportunity) => Promise<void>;
  handleBeginResponse: (contractId: string, contractData: Opportunity) => void;
  handleViewDetails: (opportunity: Opportunity) => void;
  refinedQuery: string;
  showRefinedQuery: boolean;
  setShowRefinedQuery: React.Dispatch<React.SetStateAction<boolean>>;
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  expandedDescriptions: Record<string, boolean>;
  setExpandedDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleSuggestedQueryClick: (query: string) => void;
  applyFilters:() => Promise<void>;
}

export interface HeaderProps {
  logout: () => Promise<void>;
  pursuitCount: number;
}

export interface FilterValues {
  dueDate: string;
  postedDate: string;
  naicsCode: string;
  opportunityType: string;
  contractType: string | null;
  platform: string | null;
}

export interface Opportunity {
  id: string;
  title: string;
  agency: string;
  description: string;
  platform: string;
  external_url: string;
  naics_code: string;
  published_date: string;
  response_date: string | null;
  budget?: string;
  solicitation_number?: string;
  active?: boolean;
  type?: string;
  additional_description?: string;
  summary_ai?:string;
}

export interface SearchParams {
  query: string;
  contract_type?: string | null;
  platform?: string | null;
  page: number;
  page_size: number;
  due_date_filter?: string | null;
  posted_date_filter?: string | null;
  naics_code?: string | null;
  opportunity_type?: string | null;
  sort_by?: string;
  user_id?: string;
  is_new_search?: boolean;
  existing_refined_query?: string;
}