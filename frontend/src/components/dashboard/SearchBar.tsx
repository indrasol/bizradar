import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    selectionType: string;
    platform: string;
    onSearchResults: (results: any[] | undefined) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ selectionType, platform, onSearchResults }) => {
    const [query, setQuery] = useState("");

    const handleSearch = async () => {
        let endpoint = "";

        if (selectionType === "government") {
            endpoint = "http://127.0.0.1:5000/government-contracts";
            if (platform === "sam.gov") {
                endpoint += "/sam-gov";
            } else if (platform === "fpds") {
                endpoint += "/fpds";
            } else if (platform === "all-platforms") {
                endpoint += "/all-platforms";
            }
        } else if (selectionType === "freelance") {
            endpoint = "http://127.0.0.1:5000/freelance-jobs";
            if (platform === "freelancer") {
                endpoint += "/freelancer";
            } else if (platform === "all-platforms") {
                endpoint += "/all-platforms";
            }
        }

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });
            const data = await response.json();

            console.log("Response from backend:", data);

            // Check if the response has the expected structure
            if (data && data.results) {
                console.log("Data being passed to onSearchResults:", data);
                onSearchResults(data); // Pass the entire data object
            } else {
                console.error("Unexpected results format:", data);
                onSearchResults(undefined);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            onSearchResults(undefined);
        }
    };

    const handleSearchResults = (newResults) => {
        console.log("New Results:", newResults);

        // Check if newResults is defined and has the expected structure
        if (!newResults || !newResults.results || !newResults.results.opportunities) {
            console.error("Unexpected results format:", newResults);
            return; // Exit if the format is not as expected
        }

        let formattedResults;

        if (selectionType === "freelance" && Array.isArray(newResults.results.opportunities)) {
            // Handle Freelancer results
            formattedResults = newResults.results.opportunities.map((result, index) => ({
                id: `fl-${index + 1}`,
                title: result.title.trim(),
                agency: "Freelancer",
                platform: "Freelancer",
                value: result.avg_bid.replace(/\n/g, '').trim(),
                dueDate: result.days_left.replace(/\n/g, '').trim(),
                status: "Open",
                naicsCode: result.avg_bid.replace(/\n/g, '').trim(),
            }));
        } else if (selectionType === "government" && Array.isArray(newResults.results)) {
            // Handle SAM.gov results
            formattedResults = newResults.results.map((result, index) => ({
                id: `gov-${index + 1}`,
                title: result.title,
                agency: result.department || "Unknown Agency",
                platform: "SAM.gov",
                value: null,
                dueDate: result.responseDeadline || "N/A",
                status: "Open",
                naicsCode: result.naicsCode || "N/A",
            }));
        } else if (selectionType === "fpds" && newResults.results.opportunities && Array.isArray(newResults.results.opportunities)) {
            // Handle FPDS results
            formattedResults = newResults.results.opportunities.map((result, index) => ({
                id: `fpds-${index + 1}`,
                title: result.legal_business_name,
                agency: result.award_type,
                platform: "FPDS",
                value: null,
                dueDate: result.date_signed,
                status: "Open",
                naicsCode: result.unique_entity_id,
            }));
        } else {
            console.error("Unexpected results format:", newResults);
            return; // Exit if the format is not as expected
        }

        onSearchResults(formattedResults);
        console.log("Updated Contracts:", formattedResults);
    };

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                className="pl-10 w-full"
                placeholder="Search contracts, companies, or keywords..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
        </div>
    );
};
