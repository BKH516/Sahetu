import React, { useState, useEffect, useRef } from 'react';

interface InfiniteTypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export const InfiniteTypewriterText: React.FC<InfiniteTypewriterTextProps> = React.memo(({ 
  text, 
  speed = 100, 
  className = "" 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start typing immediately if text is available and we're not deleting
    if (!isDeleting && currentIndex < text.length && text.length > 0) {
      // Typing
      timeoutRef.current = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else if (!isDeleting && currentIndex >= text.length && text.length > 0) {
      // Pause before deleting
      timeoutRef.current = setTimeout(() => {
        setIsDeleting(true);
      }, 2000); 
    } else if (isDeleting && displayText.length > 0) {
      // Deleting
      timeoutRef.current = setTimeout(() => {
        setDisplayText(prev => prev.slice(0, -1));
      }, speed / 2); 
    } else if (isDeleting && displayText.length === 0) {
      // Reset
      setIsDeleting(false);
      setCurrentIndex(0);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, text, speed, isDeleting, displayText]);

  useEffect(() => {
    // Reset when text changes
    setDisplayText('');
    setCurrentIndex(0);
    setIsDeleting(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Start typing immediately when text is available and component is mounted
    if (text && text.length > 0 && displayText === '') {
      const timer = setTimeout(() => {
        setDisplayText(text[0]);
        setCurrentIndex(1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [text, speed]);

  const hasGradient = className.includes('bg-gradient-to-r') || className.includes('bg-clip-text');
  
  return (
    <span 
      className={`text-animate inline-block ${className}`} 
      style={hasGradient ? { 
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      } : {}}
    >
      {displayText}
      <span className="typewriter-cursor animate-pulse inline-block ml-1 text-white">|</span>
    </span>
  );
});

InfiniteTypewriterText.displayName = 'InfiniteTypewriterText'; 