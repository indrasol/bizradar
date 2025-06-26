import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Brain, Copy, Check } from 'lucide-react';
import { TypeWriter } from '../ui/TypeWriter';

const RefinedQueryDisplay = ({ originalQuery, refinedQuery, isVisible, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse the refined query to highlight the different components
  const parseQuery = (query) => {
    if (!query) return [];

    // Split by OR and AND
    const parts = [];
    let currentString = '';
    let inQuotes = false;

    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      const nextThree = query.substr(i, 3);
      const nextFour = query.substr(i, 4);

      if (char === '"') {
        inQuotes = !inQuotes;
        currentString += char;
      } else if (!inQuotes && nextThree === ' OR ' && currentString.trim()) {
        parts.push({ type: 'term', content: currentString.trim() });
        parts.push({ type: 'operator', content: ', ' });
        currentString = '';
        i += 3;
      } else if (!inQuotes && nextFour === ' AND ' && currentString.trim()) {
        parts.push({ type: 'term', content: currentString.trim() });
        parts.push({ type: 'operator', content: ' AND ' });
        currentString = '';
        i += 4;
      } else {
        currentString += char;
      }
    }

    if (currentString.trim()) {
      parts.push({ type: 'term', content: currentString.trim() });
    }

    return parts;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refinedQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const terms = parseQuery(refinedQuery);

  if (!isVisible) return null;

  return (
    <div className="mb-3 bg-gradient-to-r from-purple-50 to-indigo-50 backdrop-blur-lg border border-indigo-200 rounded-xl shadow-lg transition-all duration-300 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-2 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">
              AI-Enhanced Search Query
            </h2>
            <p className="text-xs text-gray-500">Your search has been expanded with related terms for better results</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Copy enhanced query"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isExpanded ? (
        <div className="py-2 px-6 flex items-center">
          <div className="mr-3">
            <div className="text-sm font-medium text-gray-500 mb-1">Original:</div>
            <div className="text-sm font-medium text-gray-500">Enhanced:</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-medium text-gray-700 mb-1">{originalQuery}</div>
            <div className="text-sm font-mono text-gray-600 truncate">
              {
                refinedQuery.replaceAll(' OR ', ', ')
              }
              {/* {refinedQuery && (
                <TypeWriter
                  text={refinedQuery}
                  onComplete={() => {
                    console.log('Animation completed');
                  }}
                />
              )} */}
              </div>
          </div>
        </div>
      ) : (
        <div className="py-2 px-6">
          <div className="flex items-center mb-1">
            <div className="text-sm font-medium text-gray-500 mr-6">Original:</div>
            <div className="font-medium text-gray-700">{originalQuery}</div>
          </div>

          <div className="flex flex-col mb-2">
            <div className="text-sm font-medium text-gray-500 mb-1">Enhanced:</div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-inner">
              <div className="flex flex-wrap">
                {terms.map((term, index) => (
                  <span
                    key={index}
                    className={
                      term.type === 'operator'
                        ? 'text-purple-600 font-bold px-1'
                        : 'bg-indigo-50 text-indigo-800 px-2 py-1 rounded-md m-0.5'
                    }
                  >
                    {term.content.replaceAll(' OR ', ', ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <div className="flex items-center mb-2">
              <Sparkles size={18} className="text-purple-500 mr-2" />
              <h4 className="font-medium text-gray-800">How AI Enhanced Your Search</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Our AI has analyzed your original query and expanded it with related terms, industry-specific vocabulary, and relevant concepts to help you find more opportunities.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-1">Added to your search:</h5>
                <ul className="space-y-1 text-gray-600 pl-5 list-disc">
                  <li>Industry-standard terminology</li>
                  <li>Related methodologies & frameworks</li>
                  <li>Commonly used acronyms</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-1">Benefits:</h5>
                <ul className="space-y-1 text-gray-600 pl-5 list-disc">
                  <li>Finds opportunities using different terms</li>
                  <li>Improves relevant match quality</li>
                  <li>Uncovers opportunities you might miss</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefinedQueryDisplay;