import React from "react";
import { ChevronUp } from "lucide-react";

import { ScrollToTopButtonProps } from "../../models/opportunities"

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ isVisible, scrollToTop }) => {
  return (
    isVisible && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 bg-white text-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-50 transition-colors border border-blue-200 group z-50"
      >
        <ChevronUp size={20} />
        <span className="absolute right-full mr-2 whitespace-nowrap bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Back to top
        </span>
      </button>
    )
  );
};

export default ScrollToTopButton;