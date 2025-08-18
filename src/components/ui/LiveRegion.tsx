'use client';

import React, { useEffect, useRef } from 'react';
import VisuallyHidden from './VisuallyHidden';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  clearOnUnmount?: boolean;
  clearDelay?: number;
}

/**
 * LiveRegion component announces dynamic content changes to screen readers.
 * This is essential for providing feedback about actions, status changes,
 * and other dynamic updates that occur without page navigation.
 */
export default function LiveRegion({ 
  message, 
  politeness = 'polite',
  atomic = true,
  clearOnUnmount = true,
  clearDelay = 0
}: LiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If there's a delay, set a timeout to clear the message
    if (clearDelay > 0 && message) {
      timeoutRef.current = setTimeout(() => {
        // This would trigger a re-render with an empty message
        // In a real implementation, you might want to use a state management solution
      }, clearDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearDelay]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [clearOnUnmount]);

  if (!message) return null;

  return (
    <VisuallyHidden
      as="div"
      aria-live={politeness}
      aria-atomic={atomic}
      role={politeness === 'assertive' ? 'alert' : 'status'}
    >
      {message}
    </VisuallyHidden>
  );
}

// Hook for managing live region announcements
export function useLiveRegion() {
  const [message, setMessage] = React.useState('');
  const [politeness, setPoliteness] = React.useState<'polite' | 'assertive'>('polite');

  const announce = React.useCallback((
    newMessage: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    setPoliteness(priority);
    setMessage(newMessage);
    
    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => setMessage(''), 100);
  }, []);

  const clear = React.useCallback(() => {
    setMessage('');
  }, []);

  return {
    announce,
    clear,
    LiveRegionComponent: () => (
      <LiveRegion message={message} politeness={politeness} />
    )
  };
}
