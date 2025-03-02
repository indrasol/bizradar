import { useEffect, useState } from 'react';

interface TypeWriterProps {
  text: string;
  onComplete?: () => void;
}

export const TypeWriter = ({ text, onComplete }: TypeWriterProps) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    console.log("Starting typewriter effect for text:", text); // Debug: Check text input
    let currentIndex = 0;
    setDisplayText('');

    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText((prev) => prev + text[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        console.log("Typewriter effect completed."); // Debug: Confirm completion
        onComplete?.();
      }
    }, 100); // Adjusted for slower effect for visibility in debugging

    return () => {
      console.log("Clearing typewriter effect."); // Debug: Cleanup check
      clearInterval(intervalId);
    };
  }, [text, onComplete]);

  return (
    <div className="font-mono relative">
      {displayText}
      <span className="inline-block w-0.5 h-5 bg-blue-500 ml-1 align-middle" />
    </div>
  );
};
