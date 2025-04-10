import React, { useState, useEffect } from 'react';
import { RfpOverview } from './RfpOverview';
import RfpResponse from './rfpResponse';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye } from 'lucide-react';

interface RfpContainerProps {
  initialContent?: string;
  contract?: any; // Replace with proper contract type
}

export function RfpContainer({ initialContent = '', contract }: RfpContainerProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [generatingRfp, setGeneratingRfp] = useState(false);

  const handleGenerateRfp = async () => {
    setShowEditor(true);
    setGeneratingRfp(true);

    setTimeout(() => {
      setGeneratingRfp(false);
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f9fafb] relative">
      <div className="flex h-full">
        <div className="w-full">
          <div className="p-6">
            <RfpOverview
              title={contract?.title}
              department={contract?.department}
              dueDate={contract?.dueDate}
              status={contract?.status}
              naicsCode={contract?.naicsCode}
              description={contract?.description}
              solicitation_number={contract?.solicitation_number}
              published_date={contract?.published_date}
              onViewDescription={() => window.open(contract?.external_url || contract?.url || '', '_blank')}
              onGenerateResponse={() => {}} // unused
              onGenerateRfp={handleGenerateRfp}
            />
          </div>

          <AnimatePresence>
            {showEditor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full p-6"
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  {generatingRfp ? (
                    <div className="flex flex-col items-center justify-center h-64 p-6">
                      <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                      <p className="text-gray-600 font-medium">
                        Generating RFP response...
                      </p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                    </div>
                  ) : (
                    <>
                      <RfpResponse contract={contract} pursuitId={contract?.id} />
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
