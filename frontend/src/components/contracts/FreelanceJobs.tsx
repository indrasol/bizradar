import { useState } from "react";
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
    platform: "Upwork",
    budget: "10000-15000",
    duration: "3 months",
    skills: ["Python", "NLP", "TensorFlow"],
    status: "Open",
  },
];

export const FreelanceJobs = () => {
  const [contracts, setContracts] = useState(initialContracts);
  const [selectedPlatform, setSelectedPlatform] = useState("freelancer");
  const selectionType = "freelance";

  const handleSearchResults = (newResults: SearchResponse) => {
    if (!newResults?.results?.opportunities) {
      console.error("Unexpected results format:", newResults);
      return;
    }

    const formattedResults = newResults.results.opportunities.map((result, index) => ({
      id: `fl-${index + 1}`,
      title: result.title,
      platform: "Freelancer",
      budget: result.avg_bid,
      duration: result.days_left,
      skills: [],
      status: "Open",
    }));

    setContracts(formattedResults);
  };

  return (
    <div className="space-y-4">
      <SearchBar 
        selectionType={selectionType} 
        platform={selectedPlatform} 
        onSearchResults={handleSearchResults} 
      />
      <div className="flex gap-4 my-4">
        <Select onValueChange={(value) => setSelectedPlatform(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upwork">Upwork</SelectItem>
            <SelectItem value="fiverr">Fiverr</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="all">All Platforms</SelectItem>
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
          <Link key={contract.id} to={`/contracts/${contract.id}`}>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{contract.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Globe className="w-4 h-4 mr-1" />
                    {contract.platform}
                  </div>
                </div>
                <Badge>{contract.status}</Badge>
              </div>
              
              <div className="mt-4 flex gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${contract.budget}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {contract.duration}
                </div>
              </div>
              
              {contract.skills && (
                <div className="mt-3 flex gap-2">
                  {contract.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};