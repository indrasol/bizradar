import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Calendar, Building2, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { useNavigate } from "react-router-dom";
import { useTrack } from "@/logging";


// Typewriter Animation Component
const TypewriterAnimation = ({ text, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    
    // Reset when text changes
    setDisplayText('');
    setCurrentIndex(0);
    
    // Type the text character by character
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 30); // Speed of typing
    
    return () => clearInterval(interval);
  }, [text, currentIndex, onComplete]);

  return (
    <div className="bg-black/10 backdrop-blur-sm rounded-md p-3 font-mono text-sm text-green-500 overflow-x-auto max-w-full">
      <span className="whitespace-pre-wrap">{displayText}</span>
      <span className="animate-pulse">|</span>
    </div>
  );
};

interface Contract {
  id: string;
  title: string;
  agency: string;
  platform: string;
  value: number;
  dueDate: string;
  status: string;
  naicsCode: string;
}

const initialContracts: Contract[] = [
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
  }
];

export const GovernmentContracts = () => {

  const navigate = useNavigate();

  const track=useTrack();

  const handleGenerateRFP = (contract: Contract) => {
    // Ensure you are passing the entire contract object correctly

    track({
      event_name: "generate_rfp",
      event_type: "button_click",
      metadata: {
        search_query: null,
        stage: null,
        opportunity_id: contract.id,
        title: contract.title,           // optional, handy for DEs
        naics_code: contract.naicsCode,  // matches your schema naming
      },
    });
    navigate(`/contracts/rfp/${contract.id}`, { state: { contract } });
  };
  


  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [selectedPlatform, setSelectedPlatform] = useState("sam.gov");
  const selectionType = "government";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation state
  const [originalQuery, setOriginalQuery] = useState('');
  const [refinedQuery, setRefinedQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [resultsData, setResultsData] = useState(null);

  // Handle the refined query data and start animation
  const handleRefinedQuery = (original, refined) => {
    setOriginalQuery(original);
    setRefinedQuery(refined);
    setIsTyping(true);
    setAnimationComplete(false);
  };

  // When typing animation completes
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    setIsTyping(false);
  };

  const handleSearchResults = (data: any) => {
    setResultsData(data);
    
    // Only process results if animation is complete or there's no refined query
    if (animationComplete || !refinedQuery) {
      processResults(data);
    }
  };

  // Watch for animation complete and process results
  useEffect(() => {
    if (animationComplete && resultsData) {
      processResults(resultsData);
    }
  }, [animationComplete, resultsData]);

  const processResults = (data: any) => {
    if (!data || !data.results || !Array.isArray(data.results)) {
      console.error("Invalid results format:", data);
      return;
    }
  
    const formattedResults = data.results.map((result: any) => ({
      id: `gov-${Math.random().toString(36).substr(2, 9)}`,
      title: result.title || "No Title",
      agency: result.agency || "Unknown Agency",
      platform: "SAM.gov", // Since we're only using SAM.gov for now
      value: 0, // SAM.gov doesn't provide value in our current implementation
      dueDate: result.response_date || new Date().toISOString(),
      status: "Open", // Default status
      naicsCode: result.naics_code?.toString() || "N/A",
    }));
  
    console.log("Formatted results:", formattedResults);
    setContracts(formattedResults);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading contracts: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar 
        selectionType={selectionType} 
        platform={selectedPlatform} 
        onSearchResults={handleSearchResults}
        onRefinedQuery={handleRefinedQuery}
      />
      
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

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Agency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dod">Department of Defense</SelectItem>
            <SelectItem value="doe">Department of Energy</SelectItem>
            <SelectItem value="all">All Agencies</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Refined Query Animation Section */}
      {originalQuery && (
        <div className="mb-4">
          <div className="mb-2 text-sm text-gray-500">Original query: "{originalQuery}"</div>
          
          {isTyping && refinedQuery ? (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Refining search query...</div>
              <TypewriterAnimation 
                text={refinedQuery} 
                onComplete={handleAnimationComplete} 
              />
            </div>
          ) : refinedQuery ? (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Refined query:</div>
              <div className="bg-black/10 backdrop-blur-sm rounded-md p-3 font-mono text-sm text-green-500 overflow-x-auto">
                {refinedQuery}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {isLoading || isTyping ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">
            {isTyping ? "Processing refined query..." : "Loading contracts..."}
          </p>
        </div>
      ) : contracts.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          <p>No contracts found. Try adjusting your search criteria.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{contract.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 className="w-4 h-4 mr-1" />
                    {contract.agency}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      handleGenerateRFP(contract);
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Generate RFP
                  </Button>
                  <Badge>{contract.status}</Badge>
                </div>
              </div>
              
              <div className="mt-4 flex gap-4">
                {contract.value > 0 && (
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${contract.value.toLocaleString()}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Due: {new Date(contract.dueDate).toLocaleDateString()}
                </div>
                <Badge variant="outline">{contract.naicsCode}</Badge>
                <Badge variant="secondary">{contract.platform}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
