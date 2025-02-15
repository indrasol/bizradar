import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar } from "lucide-react";

const contracts = [
  {
    id: 1,
    title: "AI-Powered Data Analytics Platform",
    company: "TechCorp Inc.",
    value: 150000,
    dueDate: "2024-03-15",
    status: "Open",
  },
  {
    id: 2,
    title: "Cybersecurity Assessment Service",
    company: "SecureNet Solutions",
    value: 75000,
    dueDate: "2024-03-20",
    status: "Under Review",
  },
  {
    id: 3,
    title: "ETL Pipeline Development",
    company: "DataFlow Systems",
    value: 95000,
    dueDate: "2024-03-25",
    status: "Open",
  },
];

export const ContractsList = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Opportunities</h3>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{contract.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{contract.company}</p>
              </div>
              <Badge variant="secondary">{contract.status}</Badge>
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center text-sm text-gray-500">
                <DollarSign className="w-4 h-4 mr-1" />
                ${contract.value.toLocaleString()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Due: {new Date(contract.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};