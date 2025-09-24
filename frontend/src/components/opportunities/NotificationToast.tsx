import React from "react";
import { Check } from "lucide-react";

import { NotificationToastProps } from "../../models/opportunities"

const NotificationToast: React.FC<NotificationToastProps> = ({ show }) => {
  return (
    show && (
      <div className="fixed bottom-6 right-6 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up z-50">
        {/* <Check size={18} /> */}
        {/* <span className="font-medium">Added to Pursuits</span> */}
      </div>
    )
  );
};

export default NotificationToast;