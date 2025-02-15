import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Calendar, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchBar } from "@/components/dashboard/SearchBar";

const initialContracts = [
  {
    id: "gov-1",
    title: "Cybersecurity Infrastructure Upgrade",
    agency: "Department of Defense",
    platform: "SAM.gov",
    value: 2500000,
    dueDate: "2024-04-15",
    status: "Open",
    naicsCode: "541512",
  },
  {
    id: "gov-2",
    title: "AI-Powered Data Analytics Platform",
    agency: "Department of Energy",
    platform: "GovWin",
    value: 1800000,
    dueDate: "2024-04-20",
    status: "Open",
    naicsCode: "541511",
  },
];

export const GovernmentContracts = () => {
  const [contracts, setContracts] = useState(initialContracts);
  const [selectedPlatform, setSelectedPlatform] = useState("sam.gov");
  const selectionType = "government";

  const handleSearchResults = (newResults) => {
    // Map the new results to match the existing contract structure
    const formattedResults = newResults.map((result) => ({
      id: result.title, // Use title as ID for simplicity; ensure it's unique
      title: result.title,
      agency: result.department, // Use department as agency
      platform: result.platform || "SAM.gov", // Default to SAM.gov if not provided
      value: null, // Set to null or any default value if not available
      dueDate: result.responseDeadline,
      status: "Open", // Default status, adjust as needed
      naicsCode: result.naicsCode,
    }));

    // Replace the contracts state with the new results
    setContracts(formattedResults);
  };

  const formatDate = (dateStr) => {
    // Convert date string to 'DD Month YYYY' format
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <SearchBar selectionType={selectionType} platform={selectedPlatform} onSearchResults={handleSearchResults} />
      <div className="flex gap-4 my-4">
        <Select onValueChange={(value) => setSelectedPlatform(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sam.gov">SAM.gov</SelectItem>
            <SelectItem value="fpds">FPDS.gov</SelectItem>
            <SelectItem value="all-platforms">All Platforms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <Card key={contract.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{contract.title}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  {contract.agency}
                </div>
              </div>
              <Badge>{contract.status}</Badge>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center text-sm text-gray-500">
                Due: {new Date(contract.dueDate).toLocaleDateString()}
              </div>
              <Badge variant="outline">{contract.naicsCode}</Badge>
              <Badge variant="secondary">{contract.platform}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};