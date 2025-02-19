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
    console.log("New Results:", newResults);

    // Early return if no results
    if (!newResults) {
      console.error("No results received");
      return;
    }

    let formattedResults = [];

    // Handle FPDS.gov results
    if (selectedPlatform === "fpds") {
      // Check for FPDS specific structure
      if (newResults.results?.opportunities && Array.isArray(newResults.results.opportunities)) {
        formattedResults = newResults.results.opportunities.map((result, index) => ({
          id: `fpds-${index + 1}`,
          title: result.legal_business_name || result.title || "Untitled Contract",
          agency: result.award_type || result.agency || "Not Specified",
          platform: "FPDS.gov",
          value: result.obligated_amount || null,
          dueDate: result.date_signed || "N/A",
          status: result.status || "Open",
          naicsCode: result.unique_entity_id || result.naics_code || "N/A",
        }));
      }
    }
    // Handle SAM.gov results
    else if (selectedPlatform === "sam.gov") {
      // Check for SAM.gov specific structure
      if (newResults.results && Array.isArray(newResults.results)) {
        formattedResults = newResults.results.map((result, index) => ({
          id: `sam-${index + 1}`,
          title: result.title,
          agency: result.department || "Unknown Agency",
          platform: "SAM.gov",
          value: result.value || null,
          dueDate: result.responseDeadline || "N/A",
          status: "Open",
          naicsCode: result.naicsCode || "N/A",
        }));
      }
    }
    // Handle all-platforms results
    else if (selectedPlatform === "all-platforms") {
      const allResults = [];
      
      // Process SAM.gov results if present
      if (newResults.sam_results && Array.isArray(newResults.sam_results)) {
        const samResults = newResults.sam_results.map((result, index) => ({
          id: `sam-${index + 1}`,
          title: result.title,
          agency: result.department || "Unknown Agency",
          platform: "SAM.gov",
          value: result.value || null,
          dueDate: result.responseDeadline || "N/A",
          status: "Open",
          naicsCode: result.naicsCode || "N/A",
        }));
        allResults.push(...samResults);
      }

      // Process FPDS results if present
      if (newResults.fpds_results?.opportunities && Array.isArray(newResults.fpds_results.opportunities)) {
        const fpdsResults = newResults.fpds_results.opportunities.map((result, index) => ({
          id: `fpds-${index + 1}`,
          title: result.legal_business_name || result.title || "Untitled Contract",
          agency: result.award_type || result.agency || "Not Specified",
          platform: "FPDS.gov",
          value: result.obligated_amount || null,
          dueDate: result.date_signed || "N/A",
          status: result.status || "Open",
          naicsCode: result.unique_entity_id || result.naics_code || "N/A",
        }));
        allResults.push(...fpdsResults);
      }

      formattedResults = allResults;
    }

    if (formattedResults.length === 0) {
      console.error("No results could be formatted from the response:", newResults);
      return;
    }

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
                {contract.dueDate && contract.dueDate !== "N/A" 
                  ? `Due: ${new Date(contract.dueDate).toLocaleDateString()}`
                  : "Due date not specified"}
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