import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RfpContainer } from '../components/rfp/RfpContainer';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SideBar from '../components/layout/SideBar';

export default function RfpWriter() {
  // Using noticeId from the URL
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load contract data based on notice ID
    const loadContractData = async () => {
      try {
        // First check sessionStorage for contract data that matches the notice ID
        const storedContract = sessionStorage.getItem('currentContract');
        if (storedContract) {
          console.log("Found contract in session storage:", storedContract);
          const parsedContract = JSON.parse(storedContract);
          
          // Check if this contract has the matching notice ID
          if (parsedContract.notice_id === noticeId || parsedContract.id === noticeId) {
            console.log("Found matching contract data in session storage");
            setContract(parsedContract);
            setLoading(false);
            return true;
          } else {
            console.log("Stored contract doesn't match the notice ID, fetching from API");
          }
        }
        
        // If we didn't find a match in session storage, fetch from API
        return await fetchFromAPI(noticeId);
      } catch (error) {
        console.error('Error loading contract data:', error);
        setError('Failed to load contract details. Please try again later.');
        setLoading(false);
        return false;
      }
    };

    loadContractData();
  }, [noticeId]);

  // Fetch contract data from API using the notice ID
  const fetchFromAPI = async (noticeId) => {
    setLoading(true);
    try {
      const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const API_BASE_URL = isDevelopment ? "http://localhost:5000" : "https://bizradar-backend.onrender.com";
      
      console.log(`Fetching contract data from API for notice ID: ${noticeId}`);
      
      const response = await fetch(`${API_BASE_URL}/get-opportunity/${noticeId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching contract: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      // Process the data
      const processedData = {
        id: data.id || noticeId,
        notice_id: noticeId,
        title: data.title,
        department: data.department || data.agency,
        dueDate: data.response_date || data.dueDate,
        status: data.active !== undefined ? (data.active ? "Active" : "Inactive") : "Open",
        naicsCode: data.naics_code || data.naicsCode,
        description: data.description,
        external_url: data.external_url || data.url,
        solicitation_number: data.solicitation_number,
        published_date: data.published_date,
        platform: data.platform
      };
      
      setContract(processedData);
      // Update session storage with the new data
      sessionStorage.setItem('currentContract', JSON.stringify(processedData));
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error fetching from API:', error);
      setError('Failed to load contract details from API. Please try again later.');
      setLoading(false);
      return false;
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="w-full bg-blue-600 text-white text-center py-2 px-4">
          <div className="flex items-center justify-center">
            <span>Subscription Plans.</span>
            <a href="#" className="ml-2 font-medium underline decoration-2 underline-offset-2">
              Book a demo here
            </a>
          </div>
        </div>
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
        <div className="w-full bg-blue-600 text-white text-center py-2 px-4">
          <div className="flex items-center justify-center">
            <span>Subscription Plans.</span>
            <a href="#" className="ml-2 font-medium underline decoration-2 underline-offset-2">
              Book a demo here
            </a>
          </div>
        </div>
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
                onClick={() => fetchFromAPI(noticeId)}
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

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full bg-blue-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center">
          <span>Subscription Plans.</span>
          <a href="#" className="ml-2 font-medium underline decoration-2 underline-offset-2">
            Book a demo here
          </a>
        </div>
      </div>
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