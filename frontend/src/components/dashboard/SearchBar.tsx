import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SearchBar = () => {
  return (
    <div className="relative flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          className="pl-10 w-full"
          placeholder="Search contracts, companies, or keywords..."
        />
      </div>
      <Button variant="default" className="px-4 py-2">
        Search
      </Button>
    </div>
  );
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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

            if (data?.results?.opportunities && Array.isArray(data.results.opportunities)) {
                console.log("Data being passed to onSearchResults:", data.results.opportunities);
                onSearchResults(data.results.opportunities);
            } else {
                console.error("Unexpected results format:", data);
                onSearchResults(undefined);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            onSearchResults(undefined);
        }
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
