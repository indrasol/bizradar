// Example usage of UniversalLoader component
// This file demonstrates different ways to use the UniversalLoader

import React, { useState } from 'react';
import UniversalLoader from './UniversalLoader';

export const LoaderExamples = () => {
  const [showModal, setShowModal] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">UniversalLoader Examples</h1>
      
      {/* Modal Loader */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Modal Loader</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Show Modal Loader
        </button>
        {showModal && (
          <UniversalLoader
            isLoading={true}
            loadingText="Processing Request"
            description="Please wait while we process your data..."
            icon="target"
            size="md"
            variant="modal"
            showProgress={true}
            progress={75}
          />
        )}
        <button 
          onClick={() => setShowModal(false)}
          className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Hide Modal
        </button>
      </section>

      {/* Inline Loader */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Inline Loader</h2>
        <button 
          onClick={() => setShowInline(!showInline)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-4"
        >
          Toggle Inline Loader
        </button>
        {showInline && (
          <UniversalLoader
            isLoading={true}
            loadingText="Searching"
            description="Finding the best opportunities for you..."
            icon="search"
            size="lg"
            variant="inline"
            showProgress={true}
          />
        )}
      </section>

      {/* Overlay Loader */}
      <section className="relative min-h-[300px] bg-gray-100 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Overlay Loader</h2>
        <p>This content will be covered by the overlay loader.</p>
        <button 
          onClick={() => setShowOverlay(!showOverlay)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 mt-2"
        >
          Toggle Overlay
        </button>
        
        {showOverlay && (
          <UniversalLoader
            isLoading={true}
            loadingText="Loading Content"
            description="Fetching data from server..."
            icon="eye"
            size="sm"
            variant="overlay"
          />
        )}
      </section>

      {/* Progress Loader */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Progress Loader</h2>
        <button 
          onClick={simulateProgress}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 mb-4"
        >
          Simulate Progress
        </button>
        <UniversalLoader
          isLoading={progress < 100}
          loadingText="Uploading Files"
          successText="Upload Complete!"
          description={progress < 100 ? "Uploading your documents..." : "All files uploaded successfully"}
          icon={progress < 100 ? "target" : "check"}
          size="md"
          variant="inline"
          showProgress={true}
          progress={progress}
        />
      </section>

      {/* Size Variations */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Size Variations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UniversalLoader
            isLoading={true}
            loadingText="Small"
            icon="target"
            size="sm"
            variant="inline"
          />
          <UniversalLoader
            isLoading={true}
            loadingText="Medium"
            icon="target"
            size="md"
            variant="inline"
          />
          <UniversalLoader
            isLoading={true}
            loadingText="Large"
            icon="target"
            size="lg"
            variant="inline"
          />
        </div>
      </section>

      {/* Icon Variations */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Icon Variations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UniversalLoader
            isLoading={false}
            successText="Success!"
            icon="check"
            size="sm"
            variant="inline"
          />
          <UniversalLoader
            isLoading={true}
            loadingText="Viewing"
            icon="eye"
            size="sm"
            variant="inline"
          />
          <UniversalLoader
            isLoading={true}
            loadingText="Targeting"
            icon="target"
            size="sm"
            variant="inline"
          />
          <UniversalLoader
            isLoading={true}
            loadingText="Searching"
            icon="search"
            size="sm"
            variant="inline"
          />
        </div>
      </section>
    </div>
  );
};

export default LoaderExamples;
