import { Card } from "@/components/ui/card";
import { Check, X, Clock } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "submission",
    title: "Proposal Submitted",
    project: "AI Analytics Platform",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    type: "review",
    title: "Contract Under Review",
    project: "Data Pipeline Project",
    time: "5 hours ago",
    status: "pending",
  },
  {
    id: 3,
    type: "rejection",
    title: "Proposal Declined",
    project: "Security Audit Service",
    time: "1 day ago",
    status: "rejected",
  },
];

export const ActivityTimeline = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="mt-1">{getStatusIcon(activity.status)}</div>
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-gray-500">{activity.project}</p>
              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};