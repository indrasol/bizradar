import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RfpContainer } from '../components/rfp/RfpContainer';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SideBar from '../components/layout/SideBar';

export default function RfpWriter() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to load contract data from sessionStorage
    const loadContractData = () => {
      try {
        console.log("Attempting to load from sessionStorage");
        const storedContract = sessionStorage.getItem('currentContract');
        console.log("Raw data from sessionStorage:", storedContract);
        
        if (storedContract) {
          console.log("Contract data found in sessionStorage");
          setContract(JSON.parse(storedContract));
          setLoading(false);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error loading contract data:', error);
        return false;
      }
    };

    // First try to load from sessionStorage
    const contractLoaded = loadContractData();
    
    // If not found in sessionStorage, fetch from API
    if (!contractLoaded) {
      console.log("Contract not loaded from sessionStorage, fetching from API");
      fetchContractData();
    }
  }, [contractId]);

  const fetchContractData = async () => {
    setLoading(true);
    try {
      console.log("Fetching contract data for ID:", contractId);
      
      // You would replace this with your actual API call
      // For demonstration, using a timeout to simulate API call
      setTimeout(() => {
        // Example fallback data if API call isn't implemented
        const fallbackData = {
          id: contractId,
          title: `Contract ${contractId}`,
          department: "Unknown Agency",
          dueDate: "2025-03-31",
          value: 100000,
          status: "Open",
          naicsCode: "000000", 
          description: "This is a placeholder description for the contract. In a real implementation, this would be fetched from your API."
        };
        
        console.log("Setting fallback contract data:", fallbackData);
        setContract(fallbackData);
        setLoading(false);
      }, 1000);
      
      // In a real implementation, you would do something like:
      /*
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) {
        throw new Error(`Error fetching contract: ${response.statusText}`);
      }
      const data = await response.json();
      setContract(data);
      */
    } catch (error) {
      console.error('Error fetching contract data:', error);
      setError('Failed to load contract details. Please try again later.');
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        
        <div className="flex flex-1">
          <SideBar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading contract details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        
        <div className="flex flex-1">
          <SideBar />
          <div className="flex-1 p-6">
            <button 
              onClick={handleGoBack}
              className="flex items-center text-blue-600 mb-6 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Opportunities
            </button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchContractData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("Rendering RfpContainer with contract:", contract);

  return (
    <div className="h-screen flex flex-col">
      
      <div className="flex flex-1">
        <SideBar />
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
            <button 
              onClick={handleGoBack}
              className="flex items-center text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Opportunities
            </button>
          </div>
          <div className="flex-1">
            <RfpContainer 
              contract={contract}
              initialContent=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}