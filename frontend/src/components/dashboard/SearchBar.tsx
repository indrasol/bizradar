import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SearchBarProps {
  selectionType: string;
  platform: string;
  onSearchResults: (results: any) => void;
}

export const SearchBar = ({ selectionType, platform, onSearchResults }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
        const response = await fetch('http://localhost:5000/search-opportunities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                contract_type: selectionType,
                platform
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Refined Query from Backend:', data.refined_query);  // Added console logging
        onSearchResults(data);  // Pass the whole response for now
    } catch (error) {
        console.error('Error fetching search results:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Search opportunities..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="w-full"
      />
      <Button 
        onClick={handleSearch} 
        disabled={isLoading}
      >
        <Search className="w-4 h-4 mr-2" />
        {isLoading ? 'Searching...' : 'Search'}
      </Button>
    </div>
  );
};
