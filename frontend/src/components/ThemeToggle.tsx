import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  collapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = "", 
  showLabel = true,
  collapsed = false
}) => {
  const { theme, toggleTheme, isThemeToggleDisabled } = useTheme();

  // Don't render the theme toggle if it's disabled
  if (isThemeToggleDisabled) {
    return null;
  }

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    toggleTheme();
    // Remove focus from the button to hide the focus ring immediately
    event.currentTarget.blur();
  };

  if (collapsed) {
    return (
      <button
        onClick={handleToggle}
        className={`w-5 h-5 transition-all duration-300 text-gray-600 group-hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
        aria-label={`Switch to ${theme === "Light" ? "dark" : "light"} theme`}
      >
        {theme === "Light" ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Sun className={`w-5 h-5 ${theme === "Light" ? "text-yellow-500" : "text-yellow-400"}`} />
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border ${
          theme === "Dark" ? "bg-blue-600 border-blue-500" : "bg-gray-200 border-gray-300"
        }`}
        aria-label={`Switch to ${theme === "Light" ? "dark" : "light"} theme`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            theme === "Dark" ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <Moon className={`w-5 h-5 ${theme === "Dark" ? "text-blue-400" : "text-gray-400"}`} />
      {showLabel && (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {theme === "Light" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
