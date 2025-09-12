import React from "react";
import { Loader2, CheckCircle, Eye, Target, Search } from "lucide-react";

/**
 * UniversalLoader - A reusable loading component with multiple variants
 * 
 * @example
 * // Modal overlay loader
 * <UniversalLoader
 *   isLoading={true}
 *   loadingText="Processing"
 *   description="Please wait..."
 *   variant="modal"
 *   size="md"
 * />
 * 
 * @example
 * // Inline loader with progress
 * <UniversalLoader
 *   isLoading={true}
 *   loadingText="Uploading"
 *   showProgress={true}
 *   progress={75}
 *   variant="inline"
 * />
 * 
 * @example
 * // Overlay for specific content area
 * <div className="relative">
 *   <YourContent />
 *   {loading && (
 *     <UniversalLoader
 *       isLoading={true}
 *       variant="overlay"
 *       size="sm"
 *     />
 *   )}
 * </div>
 */

interface UniversalLoaderProps {
  isLoading: boolean;
  loadingText?: string;
  successText?: string;
  description?: string;
  icon?: 'eye' | 'target' | 'search' | 'check';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'modal' | 'inline' | 'overlay';
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  isLoading,
  loadingText = "Loading",
  successText = "Complete!",
  description,
  icon = 'target',
  size = 'md',
  variant = 'modal',
  showProgress = false,
  progress = 0,
  className = ""
}) => {
  // Icon mapping
  const iconMap = {
    eye: Eye,
    target: Target,
    search: Search,
    check: CheckCircle
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "p-4",
      iconWrapper: "w-12 h-12",
      iconSize: 20,
      title: "text-lg",
      description: "text-xs",
      progress: "h-2"
    },
    md: {
      container: "p-6",
      iconWrapper: "w-16 h-16",
      iconSize: 24,
      title: "text-xl",
      description: "text-sm",
      progress: "h-3"
    },
    lg: {
      container: "p-8",
      iconWrapper: "w-20 h-20",
      iconSize: 32,
      title: "text-2xl",
      description: "text-base",
      progress: "h-4"
    }
  };

  // Variant configurations
  const variantConfig = {
    modal: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
    inline: "relative w-full",
    overlay: "absolute inset-0 bg-white/95 backdrop-blur-sm z-40 flex items-center justify-center"
  };

  const IconComponent = iconMap[icon];
  const config = sizeConfig[size];

  const LoaderContent = () => (
    <div className={`bg-gradient-to-br from-white via-blue-50/30 to-white border border-gray-200 rounded-2xl shadow-lg max-w-md mx-auto relative overflow-hidden ${config.container} ${className}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full -mr-12 -mt-12"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-emerald-100/40 to-transparent rounded-full -ml-10 -mb-10"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {isLoading ? (
          <>
            {/* Loading Icon */}
            <div className="relative mb-4">
              <div className={`${config.iconWrapper} bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                <Loader2 size={config.iconSize} className="text-white animate-spin" />
              </div>
              {/* Pulse rings */}
              <div className={`absolute inset-0 ${config.iconWrapper} bg-blue-400 rounded-2xl animate-ping opacity-20`}></div>
              <div className={`absolute inset-0 ${config.iconWrapper} bg-blue-300 rounded-2xl animate-ping opacity-10`} style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Loading Text with animated dots */}
            <div className="mb-3">
              <h3 className={`${config.title} font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent flex items-center gap-2`}>
                {loadingText}
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </h3>
            </div>

            {/* Description */}
            {description && (
              <div className="mb-4 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
                <p className={`${config.description} text-gray-600 font-medium`}>
                  {description}
                </p>
              </div>
            )}

            {/* Progress Bar */}
            {showProgress && (
              <div className="w-full max-w-sm">
                <div className={`w-full bg-gray-200 rounded-full ${config.progress} overflow-hidden relative`}>
                  {/* Base blue gradient background */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full transition-all duration-500"
                    style={{ width: progress > 0 ? `${progress}%` : '100%' }}
                  ></div>
                  {/* Moving shine effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                    style={{
                      animation: 'shimmer 2.5s infinite',
                      backgroundSize: '200% 100%'
                    }}
                  ></div>
                  {/* Pulsing overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-300/40 via-blue-200/40 to-blue-300/40 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {progress > 0 ? `${progress}% complete` : "Please wait..."}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Success State */
          <>
            {/* Success Icon */}
            <div className="relative mb-4">
              <div className={`${config.iconWrapper} bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                <IconComponent size={config.iconSize} className="text-white" />
              </div>
              {/* Success pulse */}
              <div className={`absolute inset-0 ${config.iconWrapper} bg-emerald-400 rounded-2xl animate-ping opacity-20`}></div>
            </div>

            {/* Success message */}
            <div className="mb-3">
              <h3 className={`${config.title} font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent`}>
                {successText}
              </h3>
            </div>

            {/* Description */}
            {description && (
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 rounded-xl border border-emerald-300">
                <p className={`${config.description} font-medium`}>
                  {description}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS for shimmer animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `
      }} />
    </div>
  );

  // Render based on variant
  if (variant === 'modal') {
    return (
      <div className={variantConfig.modal}>
        <LoaderContent />
      </div>
    );
  } else if (variant === 'overlay') {
    return (
      <div className={variantConfig.overlay}>
        <LoaderContent />
      </div>
    );
  } else {
    return (
      <div className={variantConfig.inline}>
        <LoaderContent />
      </div>
    );
  }
};

export default UniversalLoader;
