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
};
