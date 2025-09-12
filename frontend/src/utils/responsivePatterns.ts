/**
 * Comprehensive Responsive Design Patterns for Bizradar
 * 
 * This utility provides consistent responsive design patterns that can be applied
 * across all pages in the application for optimal user experience on all devices.
 */

// =============================================================================
// CONTAINER PATTERNS
// =============================================================================

export const ResponsivePatterns = {
  // Full-width responsive containers
  containers: {
    // Main page container with full responsive padding
    fullPage: "min-h-screen w-full bg-gradient-to-b from-background to-muted px-4 sm:px-6 lg:px-8",
    
    // Centered content container with responsive max-widths
    centered: "container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16",
    
    // Card container with responsive padding
    card: "bg-card/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-border p-4 sm:p-6 lg:p-8 xl:p-10",
    
    // Modal/Dialog container
    modal: "relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl",
    
    // Wide content container (for forms, tables)
    wide: "relative z-10 w-full max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-4xl 2xl:max-w-6xl",
    
    // Dashboard/App layout container
    dashboard: "flex h-screen w-full bg-background overflow-hidden",
  },

  // =============================================================================
  // TYPOGRAPHY PATTERNS
  // =============================================================================
  typography: {
    // Main page titles
    pageTitle: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground",
    
    // Section headings
    sectionTitle: "text-lg sm:text-xl lg:text-2xl font-semibold text-foreground",
    
    // Subsection headings
    subsectionTitle: "text-base sm:text-lg font-medium text-foreground",
    
    // Body text
    body: "text-sm sm:text-base text-foreground",
    
    // Small text (captions, labels)
    small: "text-xs sm:text-sm text-muted-foreground",
    
    // Form labels
    label: "block text-xs sm:text-sm font-medium text-foreground mb-1 ml-1",
    
    // Error text
    error: "text-xs sm:text-sm text-red-600",
    
    // Success text
    success: "text-xs sm:text-sm text-green-600",
    
    // Link text
    link: "text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors",
  },

  // =============================================================================
  // SPACING PATTERNS
  // =============================================================================
  spacing: {
    // Vertical spacing between sections
    sectionGap: "space-y-6 sm:space-y-8 lg:space-y-10",
    
    // Vertical spacing between elements
    elementGap: "space-y-3 sm:space-y-4 lg:space-y-6",
    
    // Small vertical spacing
    smallGap: "space-y-2 sm:space-y-3",
    
    // Horizontal spacing for flex items
    flexGap: "gap-2 sm:gap-3 lg:gap-4",
    
    // Grid gaps
    gridGap: "gap-3 sm:gap-4 lg:gap-6",
    
    // Padding for sections
    sectionPadding: "py-4 sm:py-6 lg:py-8",
    
    // Padding for cards/containers
    cardPadding: "p-4 sm:p-6 lg:p-8",
    
    // Margin for sections
    sectionMargin: "mt-6 sm:mt-8 lg:mt-12",
  },

  // =============================================================================
  // FORM PATTERNS
  // =============================================================================
  forms: {
    // Form container
    container: "space-y-4 sm:space-y-6",
    
    // Input fields
    input: "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm sm:text-base",
    
    // Input with icon (left padding for icon)
    inputWithIcon: "w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm sm:text-base",
    
    // Textarea
    textarea: "w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm sm:text-base resize-vertical",
    
    // Primary button
    primaryButton: "w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base",
    
    // Secondary button
    secondaryButton: "w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-background border border-input rounded-lg text-foreground font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors text-sm sm:text-base",
    
    // Success button
    successButton: "w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base",
    
    // Danger button
    dangerButton: "w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base",
  },

  // =============================================================================
  // ICON PATTERNS
  // =============================================================================
  icons: {
    // Small icons (in buttons, form fields)
    small: "w-4 h-4 sm:w-5 sm:h-5",
    
    // Medium icons (section headers)
    medium: "w-5 h-5 sm:w-6 sm:h-6",
    
    // Large icons (page headers, logos)
    large: "w-6 h-6 sm:w-8 sm:h-8",
    
    // Extra large icons (hero sections)
    extraLarge: "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12",
    
    // Icon positioning in inputs
    inputIcon: "absolute left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400",
    
    // Icon positioning in buttons
    buttonIcon: "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
  },

  // =============================================================================
  // GRID PATTERNS
  // =============================================================================
  grids: {
    // Responsive card grids
    cards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6",
    
    // Two column layout
    twoColumn: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8",
    
    // Three column layout
    threeColumn: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
    
    // Table of contents / navigation
    navigation: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-1 sm:gap-2",
    
    // Feature grid
    features: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8",
  },

  // =============================================================================
  // BACKGROUND PATTERNS
  // =============================================================================
  backgrounds: {
    // Decorative background elements
    decorative: `
      fixed inset-0 pointer-events-none overflow-hidden
      [&>*:nth-child(1)]:absolute [&>*:nth-child(1)]:-top-20 [&>*:nth-child(1)]:-right-20 [&>*:nth-child(1)]:w-64 [&>*:nth-child(1)]:sm:w-80 [&>*:nth-child(1)]:lg:w-96 [&>*:nth-child(1)]:h-64 [&>*:nth-child(1)]:sm:h-80 [&>*:nth-child(1)]:lg:h-96 [&>*:nth-child(1)]:bg-gradient-to-bl [&>*:nth-child(1)]:from-blue-100 [&>*:nth-child(1)]:to-transparent [&>*:nth-child(1)]:transform [&>*:nth-child(1)]:rotate-12 [&>*:nth-child(1)]:rounded-3xl
      [&>*:nth-child(2)]:absolute [&>*:nth-child(2)]:-bottom-40 [&>*:nth-child(2)]:left-1/4 [&>*:nth-child(2)]:w-64 [&>*:nth-child(2)]:sm:w-80 [&>*:nth-child(2)]:lg:w-96 [&>*:nth-child(2)]:h-64 [&>*:nth-child(2)]:sm:h-80 [&>*:nth-child(2)]:lg:h-96 [&>*:nth-child(2)]:bg-gradient-to-tr [&>*:nth-child(2)]:from-emerald-50 [&>*:nth-child(2)]:to-transparent [&>*:nth-child(2)]:transform [&>*:nth-child(2)]:-rotate-12 [&>*:nth-child(2)]:rounded-3xl
    `,
    
    // Page gradient background
    pageGradient: "bg-gradient-to-b from-background to-muted",
    
    // Card background
    cardBackground: "bg-card/90 backdrop-blur-md",
    
    // Success background
    successBackground: "bg-green-50 border border-green-200",
    
    // Error background
    errorBackground: "bg-red-50 border border-red-200",
    
    // Warning background
    warningBackground: "bg-amber-50 border border-amber-200",
    
    // Info background
    infoBackground: "bg-blue-50 border border-blue-200",
  },

  // =============================================================================
  // COMPONENT PATTERNS
  // =============================================================================
  components: {
    // Logo component
    logo: "flex items-center gap-2 sm:gap-3",
    logoIcon: "w-6 h-6 sm:w-8 sm:h-8 text-blue-600",
    logoText: "text-xl sm:text-2xl font-semibold bg-blue-600 bg-clip-text text-transparent",
    
    // Page header
    pageHeader: "flex flex-col items-center mb-6 sm:mb-8",
    pageHeaderTitle: "text-xl sm:text-2xl lg:text-3xl font-medium text-foreground ml-3 sm:ml-4 relative",
    pageHeaderAccent: "absolute -left-3 sm:-left-4 top-1/2 transform -translate-y-1/2 w-2 h-6 sm:h-8 bg-emerald-400 rounded-r-md",
    
    // Navigation breadcrumbs
    breadcrumbs: "flex items-center gap-2 text-xs sm:text-sm text-muted-foreground",
    
    // Status badges
    badge: "inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium",
    
    // Loading spinner
    spinner: "animate-spin w-4 h-4 sm:w-5 sm:h-5",
    
    // Divider
    divider: "flex items-center my-4 sm:my-6",
    dividerLine: "flex-1 h-px bg-border",
    dividerText: "px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground",
  },

  // =============================================================================
  // TOAST CONFIGURATION
  // =============================================================================
  toast: {
    // Standard toast configuration with close button
    config: {
      closeButton: true,
      duration: 5000,
    },
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Combines multiple responsive pattern classes
 */
export const combinePatterns = (...patterns: string[]): string => {
  return patterns.filter(Boolean).join(' ');
};

/**
 * Creates a responsive container with optional additional classes
 */
export const createContainer = (type: keyof typeof ResponsivePatterns.containers, additionalClasses?: string): string => {
  return combinePatterns(ResponsivePatterns.containers[type], additionalClasses || '');
};

/**
 * Creates responsive typography with optional additional classes
 */
export const createTypography = (type: keyof typeof ResponsivePatterns.typography, additionalClasses?: string): string => {
  return combinePatterns(ResponsivePatterns.typography[type], additionalClasses || '');
};

/**
 * Creates a responsive form element with optional additional classes
 */
export const createFormElement = (type: keyof typeof ResponsivePatterns.forms, additionalClasses?: string): string => {
  return combinePatterns(ResponsivePatterns.forms[type], additionalClasses || '');
};

/**
 * Creates responsive spacing with optional additional classes
 */
export const createSpacing = (type: keyof typeof ResponsivePatterns.spacing, additionalClasses?: string): string => {
  return combinePatterns(ResponsivePatterns.spacing[type], additionalClasses || '');
};

// =============================================================================
// COMMON COMPONENT TEMPLATES
// =============================================================================

/**
 * Standard page layout template
 */
export const PageTemplate = {
  // Full page wrapper
  wrapper: ResponsivePatterns.containers.fullPage,
  
  // Main content container
  container: ResponsivePatterns.containers.centered,
  
  // Content card
  card: ResponsivePatterns.containers.card,
  
  // Page header section
  header: combinePatterns(
    ResponsivePatterns.components.pageHeader,
    ResponsivePatterns.spacing.sectionPadding
  ),
  
  // Main content section
  content: ResponsivePatterns.spacing.sectionGap,
  
  // Footer section
  footer: combinePatterns(
    "mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border",
    "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
  ),
};

/**
 * Authentication page template
 */
export const AuthTemplate = {
  wrapper: "flex justify-center items-center min-h-screen w-full bg-gradient-to-b from-background to-muted relative overflow-hidden px-4 sm:px-6 lg:px-8",
  container: ResponsivePatterns.containers.modal,
  card: ResponsivePatterns.containers.card,
  form: ResponsivePatterns.forms.container,
  logo: ResponsivePatterns.components.logo,
};

/**
 * Dashboard page template
 */
export const DashboardTemplate = {
  wrapper: ResponsivePatterns.containers.dashboard,
  sidebar: "w-64 bg-card shadow-lg hidden lg:block",
  mobileSidebar: "lg:hidden",
  main: "flex-1 flex flex-col overflow-hidden",
  header: "bg-card shadow-sm px-4 sm:px-6 lg:px-8 py-4",
  content: "flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto",
};

export default ResponsivePatterns;
