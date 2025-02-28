import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TypeWriterProps {
  text: string;
  onComplete?: () => void;
}

export const TypeWriter = ({ text, onComplete }: TypeWriterProps) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    setDisplayText('');

    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText((prev) => prev + text[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        onComplete?.();
      }
    }, 35);

    return () => clearInterval(intervalId);
  }, [text, onComplete]);

  return (
    <div className="font-mono relative">
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="inline-block w-0.5 h-5 bg-blue-500 ml-1 align-middle"
      >
        |
      </motion.span>
    </div>
  );
};