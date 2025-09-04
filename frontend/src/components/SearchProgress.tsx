import { API_ENDPOINTS } from '@/config/apiEndpoints';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SearchProgressProps {
  searchId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface ProgressData {
  stage: string;
  message: string;
  percentage: number;
  search_id: string;
}

const SearchProgress: React.FC<SearchProgressProps> = ({ searchId, onComplete, onError }) => {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchId) return;

    const eventSource = new EventSource(API_ENDPOINTS.SEARCH_PROGRESS + `/${searchId}`);

    eventSource.onmessage = (event) => {
      const progressData: ProgressData = JSON.parse(event.data);
      setProgress(progressData);

      // Show toast for important stage changes
      if (progressData.stage === 'refining_query') {
        toast.info('Refining your search query...');
      } else if (progressData.stage === 'searching') {
        toast.info('Searching for opportunities...');
      } else if (progressData.stage === 'complete') {
        toast.success('Search complete!');
        eventSource.close();
        onComplete?.();
      } else if (progressData.stage === 'error') {
        eventSource.close();
        setError(progressData.message);
        onError?.(progressData.message);
        toast.error(progressData.message);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
      setError('Connection error occurred');
      onError?.('Connection error occurred');
      toast.error('Connection error occurred');
    };

    return () => {
      eventSource.close();
    };
  }, [searchId, onComplete, onError]);

  if (error) {
    return null; // Let the toast handle error display
  }

  if (!progress) {
    return null; // Don't show loading state, let the main component handle it
  }

  return null; // We're using toasts for progress updates instead of UI elements
};

export default SearchProgress; 