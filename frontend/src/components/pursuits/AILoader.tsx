import React, { useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";

interface AILoaderProps {
  pursuitTitle: string;
  isProcessing: boolean;
  onClose?: () => void;
}

const AILoader: React.FC<AILoaderProps> = ({ 
  pursuitTitle, 
  isProcessing,
  onClose
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="p-8 mx-auto bg-card border border-border rounded-2xl shadow-2xl max-w-4xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 dark:from-emerald-900/30 to-transparent rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 dark:from-blue-900/30 to-transparent rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative z-10">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center text-center">
            {/* Animated AI Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Loader2 size={28} className="text-white animate-spin" />
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 w-16 h-16 bg-emerald-400 rounded-2xl animate-ping opacity-20"></div>
              <div className="absolute inset-0 w-16 h-16 bg-emerald-300 rounded-2xl animate-ping opacity-10" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Title with animated dots */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Analyzing with BizRadar AI
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </h3>
            </div>

            {/* Pursuit title display */}
            <div className="mb-6 px-4 py-2 bg-muted/80 backdrop-blur-sm rounded-xl border border-border shadow-sm">
              <p className="text-muted-foreground text-sm font-medium">
                <span className="text-emerald-600">"</span>
                <span className="text-foreground">{pursuitTitle}</span>
                <span className="text-emerald-600">"</span>
              </p>
            </div>

            {/* Enhanced Emerald-themed Progress bar with moving animation */}
            <div className="w-full max-w-md">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden relative">
                {/* Base emerald gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-full"></div>
                {/* Moving shine effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                  style={{
                    animation: 'shimmer 2.5s infinite',
                    backgroundSize: '200% 100%'
                  }}
                ></div>
                {/* Pulsing overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/40 via-emerald-200/40 to-emerald-300/40 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">AI is processing your request...</p>
            </div>
            
            {/* Add shimmer keyframe animation */}
            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes shimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `
            }} />
          </div>
        ) : (
          /* AI Complete State */
          <div className="flex flex-col items-center justify-center text-center">
            {/* Success Icon */}
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot size={28} className="text-white" />
              </div>
              {/* Success pulse */}
              <div className="absolute inset-0 w-16 h-16 bg-emerald-400 rounded-2xl animate-ping opacity-20"></div>
            </div>

            {/* Success message */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-foreground">
                AI Analysis Complete!
              </h3>
            </div>

            {/* Pursuit title */}
            <div className="mb-4 px-4 py-2 bg-muted/80 backdrop-blur-sm rounded-xl border border-border shadow-sm">
              <p className="text-muted-foreground text-sm font-medium">
                <span className="text-emerald-600">"</span>
                <span className="text-foreground">{pursuitTitle}</span>
                <span className="text-emerald-600">"</span>
              </p>
            </div>

            {/* AI insights ready */}
            <div className="px-6 py-3 bg-gradient-to-r from-emerald-100 dark:from-emerald-900/30 to-emerald-200 dark:to-emerald-800/30 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-300 dark:border-emerald-700">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="animate-in zoom-in-50 duration-500">
                  AI insights ready
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AILoader;
