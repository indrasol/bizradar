/**
 * Batch Responsive Update Utility
 * 
 * This utility provides common patterns and transformations that can be applied
 * across multiple pages to ensure consistent responsive design implementation.
 */

export const BatchResponsivePatterns = {
  // Common class replacements for responsive design
  classReplacements: {
    // Container patterns
    'max-w-md': 'max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl',
    'max-w-lg': 'max-w-sm sm:max-w-lg lg:max-w-xl xl:max-w-2xl',
    'max-w-xl': 'max-w-sm sm:max-w-lg lg:max-w-xl xl:max-w-2xl',
    'max-w-2xl': 'max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-4xl',
    'max-w-4xl': 'max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-4xl 2xl:max-w-6xl',
    
    // Padding patterns
    'p-8': 'p-4 sm:p-6 lg:p-8',
    'p-6': 'p-4 sm:p-6',
    'px-4': 'px-3 sm:px-4',
    'py-3': 'py-2.5 sm:py-3',
    'px-8': 'px-4 sm:px-6 lg:px-8',
    'py-8': 'py-4 sm:py-6 lg:py-8',
    
    // Typography patterns
    'text-2xl': 'text-xl sm:text-2xl',
    'text-3xl': 'text-2xl sm:text-3xl lg:text-4xl',
    'text-lg': 'text-base sm:text-lg',
    'text-sm': 'text-xs sm:text-sm',
    'text-base': 'text-sm sm:text-base',
    
    // Spacing patterns
    'space-y-6': 'space-y-4 sm:space-y-6',
    'space-y-5': 'space-y-4 sm:space-y-5',
    'space-y-4': 'space-y-3 sm:space-y-4',
    'gap-4': 'gap-3 sm:gap-4',
    'gap-3': 'gap-2 sm:gap-3',
    'mb-8': 'mb-6 sm:mb-8',
    'mb-6': 'mb-4 sm:mb-6',
    'mt-6': 'mt-4 sm:mt-6',
    
    // Icon patterns
    'w-8 h-8': 'w-6 h-6 sm:w-8 sm:h-8',
    'w-6 h-6': 'w-5 h-5 sm:w-6 sm:h-6',
    'w-5 h-5': 'w-4 h-4 sm:w-5 sm:h-5',
    'w-32 h-32': 'w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32',
    
    // Background decorative elements
    'w-96 h-96': 'w-64 sm:w-80 lg:w-96 h-64 sm:h-80 lg:h-96',
    'w-64 h-64': 'w-48 sm:w-56 lg:w-64 h-48 sm:h-56 lg:h-64',
    'w-48 h-48': 'w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-48',
    'w-32 h-32': 'w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32',
    'right-20': 'right-5 sm:right-10 lg:right-20',
    'left-10': 'left-2 sm:left-5 lg:left-10',
    
    // Form elements
    'pl-10': 'pl-8 sm:pl-10',
    'pr-10': 'pr-8 sm:pr-10',
    'py-3 px-4': 'py-2.5 sm:py-3 px-3 sm:px-4',
    
    // Grid patterns
    'grid-cols-2': 'grid-cols-1 sm:grid-cols-2',
    'grid-cols-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    'grid-cols-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },

  // Toast configuration updates
  toastPatterns: {
    'toast.success(': 'toast.success(',
    'toast.error(': 'toast.error(',
    'toast.info(': 'toast.info(',
    'toast.warning(': 'toast.warning(',
  },

  // Common responsive wrapper patterns
  wrapperPatterns: {
    authPage: 'flex justify-center items-center min-h-screen w-full bg-gradient-to-b from-white to-gray-50 relative overflow-hidden px-4 sm:px-6 lg:px-8',
    dashboardPage: 'flex min-h-screen w-full bg-gray-50',
    contentPage: 'min-h-screen w-full bg-gradient-to-b from-white to-gray-50 px-4 sm:px-6 lg:px-8',
    modalPage: 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8',
  },

  // Common component patterns
  componentPatterns: {
    logo: 'flex items-center gap-2 sm:gap-3',
    logoIcon: 'w-6 h-6 sm:w-8 sm:h-8 text-blue-600',
    logoText: 'text-xl sm:text-2xl font-semibold bg-blue-600 bg-clip-text text-transparent',
    pageHeader: 'flex flex-col items-center mb-6 sm:mb-8',
    pageTitle: 'text-xl sm:text-2xl lg:text-3xl font-medium text-gray-800 ml-3 sm:ml-4 relative',
    pageAccent: 'absolute -left-3 sm:-left-4 top-1/2 transform -translate-y-1/2 w-2 h-6 sm:h-8 bg-emerald-400 rounded-r-md',
    card: 'bg-white/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8',
    button: 'w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base',
    input: 'w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm sm:text-base',
    label: 'block text-xs sm:text-sm font-medium text-gray-700 mb-1 ml-1',
  },
};

// Pages that need responsive updates
export const PagesToUpdate = [
  'Dashboard.tsx',
  'Opportunities.tsx', 
  'Settings.tsx',
  'Homepage.tsx',
  'ForgotPassword.tsx',
  'ResetPassword.tsx',
  'NotFound.tsx',
  'ComingSoon.tsx',
  'Admin.tsx',
  'Analytics.tsx',
  'RfpWriter.tsx',
  'OpportunityDetails.tsx',
  'Pursuits.tsx',
  'Contracts.tsx',
];

// Priority levels for updates
export const UpdatePriority = {
  critical: ['Dashboard.tsx', 'Opportunities.tsx', 'Settings.tsx'],
  high: ['Homepage.tsx', 'ForgotPassword.tsx', 'ResetPassword.tsx'],
  medium: ['NotFound.tsx', 'ComingSoon.tsx', 'Admin.tsx'],
  low: ['Analytics.tsx', 'RfpWriter.tsx', 'OpportunityDetails.tsx', 'Pursuits.tsx', 'Contracts.tsx'],
};

export default BatchResponsivePatterns;
