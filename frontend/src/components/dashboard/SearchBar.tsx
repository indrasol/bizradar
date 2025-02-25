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

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:8000/${selectionType}-contracts/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      onSearchResults(data.results);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Search opportunities..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
      />
      <Button onClick={handleSearch}>
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
};
