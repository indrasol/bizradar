import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  Database, 
  RefreshCw, 
  Search, 
  FileText, 
  Users, 
  Activity, 
  Terminal, 
  BarChart3,
  TrendingUp,
  Clock,
  Github
} from 'lucide-react';

// Define the correct API base URL
const API_BASE_URL = 'http://localhost:5000';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("etl");
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerStatus, setTriggerStatus] = useState({
    message: '',
    type: null
  });
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const autoRefreshIntervalRef = useRef(null);

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Filter records when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecords(records);
      return;
    }

    const filtered = records.filter(record => 
      record.id.toString().includes(searchQuery) ||
      record.total_records.toString().includes(searchQuery) ||
      formatDate(record.time_fetched).toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredRecords(filtered);
  }, [searchQuery, records]);

  // Fetch ETL records from API
  const fetchRecords = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('page', '1');  // String values for URLSearchParams
      params.append('limit', '50'); // String values for URLSearchParams
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/etl-records?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch records: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRecords(data.records || []);
      setFilteredRecords(data.records || []);
      
      // Show success message briefly
      setTriggerStatus({
        message: 'Records refreshed successfully',
        type: 'success'
      });
      
      setTimeout(() => {
        setTriggerStatus({ message: '', type: null });
      }, 3000);
    } catch (error) {
      console.error('Error fetching records:', error);
      setTriggerStatus({
        message: `Failed to fetch records: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start limited auto-refresh of records
  const startAutoRefresh = () => {
    // Clear any existing interval
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }
    
    // Just fetch once immediately after triggering
    fetchRecords();
    
    // And then once more after a delay
    setTimeout(() => {
      fetchRecords();
    }, 15000);
  };

  // Trigger workflow manually
  const triggerWorkflow = async () => {
    setIsTriggering(true);
    setTriggerStatus({
      message: `Triggering ${selectedWorkflow || 'all'} data collection workflow...`,
      type: 'info'
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/trigger-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job_type: selectedWorkflow })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to trigger workflow: ${errorText}`);
      }
      
      const data = await response.json();
      
      setTriggerStatus({
        message: data.message || `Successfully triggered ${selectedWorkflow || 'all'} workflow(s). Check GitHub Actions for progress.`,
        type: 'success'
      });
      
      // Fetch records to show the new pending record
      startAutoRefresh();
      
    } catch (error) {
      console.error('Error triggering workflow:', error);
      setTriggerStatus({
        message: error.message || 'Failed to trigger workflow. Please check GitHub Actions configuration.',
        type: 'error'
      });
    } finally {
      setIsTriggering(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);
  
  // Fetch records on initial component load
  useEffect(() => {
    fetchRecords();
  }, []);
  
  // Get status badge classes 
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'triggered':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Render trigger type badge
  const renderTriggerBadge = (triggerType) => {
    if (!triggerType) return null;
    
    switch(triggerType) {
      case 'github-scheduled':
        return (
          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            A
          </span>
        );
      case 'github-manual':
        return (
          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            <Github className="h-3 w-3 mr-1" />
            G
          </span>
        );
      case 'ui-manual':
      default:
        return null; // No badge for UI-triggered runs
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage data workflows and system settings</p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <button 
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            onClick={fetchRecords} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => setActiveTab("etl")}
          >
            <Database className="h-4 w-4" />
            ETL Dashboard
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("etl")}
              className={`inline-flex items-center px-4 py-2 border-b-2 ${
                activeTab === "etl" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } font-medium text-sm`}
            >
              <Database className={`h-4 w-4 mr-2 ${activeTab === "etl" ? "text-blue-500" : "text-gray-400"}`} />
              ETL Monitoring
            </button>
            
            <button
              onClick={() => setActiveTab("users")}
              className={`inline-flex items-center px-4 py-2 border-b-2 ${
                activeTab === "users" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } font-medium text-sm`}
            >
              <Users className={`h-4 w-4 mr-2 ${activeTab === "users" ? "text-blue-500" : "text-gray-400"}`} />
              User Management
            </button>
            
            <button
              onClick={() => setActiveTab("logs")}
              className={`inline-flex items-center px-4 py-2 border-b-2 ${
                activeTab === "logs" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } font-medium text-sm`}
            >
              <Terminal className={`h-4 w-4 mr-2 ${activeTab === "logs" ? "text-blue-500" : "text-gray-400"}`} />
              System Logs
            </button>
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div>
        {activeTab === "etl" && (
          <div className="space-y-6">
            {/* Status Alert */}
            {triggerStatus.message && (
              <div className={`p-4 rounded-md ${
                triggerStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 
                triggerStatus.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 
                'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">
                      {triggerStatus.type === 'success' ? 'Success' : 
                       triggerStatus.type === 'error' ? 'Error' : 
                       'Information'}
                    </h3>
                    <div className="mt-2 text-sm">
                      <p>{triggerStatus.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Workflow Trigger Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Data Collection Workflow
                  </h3>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Manually trigger data collection workflows to fetch data from SAM.gov and Freelancer.com
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-64">
                    <select
                      value={selectedWorkflow}
                      onChange={(e) => setSelectedWorkflow(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">All workflows</option>
                      <option value="freelancer">Freelancer.com only</option>
                      <option value="sam_gov">SAM.gov only</option>
                    </select>
                  </div>
                  
                  <button 
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={triggerWorkflow} 
                    disabled={isTriggering}
                  >
                    {isTriggering ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Triggering...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Trigger Records
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Record Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 truncate">Total Records</p>
                      <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                        {records.length > 0 ? records[0].total_records : 0}
                      </h3>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    Last updated: {records.length > 0 ? formatDate(records[0].time_fetched) : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 truncate">SAM.gov Records</p>
                      <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                        {records.length > 0 ? records[0].sam_gov_count : 0}
                      </h3>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-green-600">
                    {records.length > 0 ? `+${records[0].sam_gov_new_count} new records` : 'No new records'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 truncate">Freelancer Records</p>
                      <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                        {records.length > 0 ? records[0].freelancer_count : 0}
                      </h3>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-purple-600">
                    {records.length > 0 ? `+${records[0].freelancer_new_count} new records` : 'No new records'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 truncate">Success Rate</p>
                      <h3 className="mt-1 text-2xl font-semibold text-gray-900">
                        {records.length > 0 
                          ? Math.round(records.filter(r => r.status === 'success').length / records.length * 100)
                          : 0}%
                      </h3>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    Based on {records.length} collection runs
                  </p>
                </div>
              </div>
            </div>
            
            {/* Records Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Data Collection History
                </h3>
                <div className="w-full sm:w-64 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search records..."
                  />
                </div>
              </div>
              
              <div className="h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Fetched
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Records
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SAM.gov Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SAM.gov New
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Freelancer Count
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Freelancer New
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={`skeleton-${i}`}>
                          {Array(8).fill(0).map((_, j) => (
                            <td key={`cell-skeleton-${i}-${j}`} className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(record.time_fetched)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.total_records}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.sam_gov_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            +{record.sam_gov_new_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.freelancer_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                            +{record.freelancer_new_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClasses(record.status)}`}>
                                {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Unknown'}
                              </span>
                              {renderTriggerBadge(record.trigger_type)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-gray-500 text-sm border-t border-gray-200 sm:px-6">
                <div className="flex items-center flex-wrap gap-4">
                  <span>Showing {filteredRecords.length} of {records.length} records</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      A
                    </span>
                    <span>= Auto-scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      <Github className="h-3 w-3 mr-1" />G
                    </span>
                    <span>= GitHub manual trigger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>No badge = Triggered from this UI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "users" && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                This section is under development. It will allow you to manage user accounts and permissions.
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                Coming Soon
              </button>
            </div>
          </div>
        )}
        
        {activeTab === "logs" && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center py-12">
              <Terminal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">System Logs</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                This section is under development. It will provide access to system and application logs.
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
