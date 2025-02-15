import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Clock, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { SearchBar } from "@/components/dashboard/SearchBar";

interface Opportunity {
  avg_bid: string;
  days_left: string;
  title: string;
}

interface Results {
  count: number;
  opportunities: Opportunity[];
}

interface SearchResponse {
  message: string;
  results: Results;
}

const initialContracts = [
  {
    id: "fl-1",
    title: "Machine Learning Engineer for NLP Project",
    agency: "Upwork",
    platform: "Freelancer",
    value: 10000,
    dueDate: "2024-04-15",
    status: "Open",
    naicsCode: "541512",
  },
  // Add more initial contracts if needed
];

export const FreelanceJobs = () => {
  const [contracts, setContracts] = useState(initialContracts);
  const [selectedPlatform, setSelectedPlatform] = useState("freelancer");
  const selectionType = "freelance";

  const handleSearchResults = (newResults) => {
    console.log("New Results:", newResults);

    // Check if newResults is defined and has the expected structure
    if (!newResults || !newResults.results || !Array.isArray(newResults.results.opportunities)) {
        console.error("Unexpected results format:", newResults);
        return; // Exit if the format is not as expected
    }

    const opportunities = newResults.results.opportunities;

    const formattedResults = opportunities.map((result, index) => ({
        id: `fl-${index + 1}`,
        title: result.title,
        agency: "Freelancer",
        platform: "Freelancer",
        value: result.avg_bid,
        dueDate: result.days_left,
        status: "Open",
        naicsCode: result.avg_bid,
    }));

    setContracts(formattedResults);
    console.log("Updated Contracts:", formattedResults);
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
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="all-platforms">All Platforms</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Budget Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-5000">$0 - $5,000</SelectItem>
            <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
            <SelectItem value="10000+">$10,000+</SelectItem>
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
                Budget: {contract.value}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                Due Date: {contract.dueDate}
              </div>
              <Badge variant="secondary">{contract.platform}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
