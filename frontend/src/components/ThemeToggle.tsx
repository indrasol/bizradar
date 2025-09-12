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

  if (collapsed) {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors hover:bg-muted ${className}`}
        aria-label={`Switch to ${theme === "Light" ? "dark" : "light"} theme`}
      >
        {theme === "Light" ? (
          <Moon className="w-5 h-5 text-blue-500" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Sun className={`w-4 h-4 ${theme === "Light" ? "text-yellow-500" : "text-gray-400"}`} />
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          theme === "Dark" ? "bg-blue-600" : "bg-gray-200"
        }`}
        aria-label={`Switch to ${theme === "Light" ? "dark" : "light"} theme`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            theme === "Dark" ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <Moon className={`w-4 h-4 ${theme === "Dark" ? "text-blue-500" : "text-gray-400"}`} />
      {showLabel && (
        <span className="text-sm font-medium text-foreground">
          {theme === "Light" ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
