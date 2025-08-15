'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface AnnouncementOptions {
  politeness?: 'polite' | 'assertive';
  clearDelay?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface Announcement {
  id: string;
  message: string;
  politeness: 'polite' | 'assertive';
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Custom hook for managing screen reader announcements.
 * Provides a queue system for announcements with different priorities
 * and prevents announcement spam.
 */
export function useScreenReaderAnnouncements() {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [queue, setQueue] = useState<Announcement[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastAnnouncementRef = useRef<string>('');
  const announcementCountRef = useRef<Map<string, number>>(new Map());

  // Process the next announcement in the queue
  const processQueue = useCallback(() => {
    setQueue(prevQueue => {
      if (prevQueue.length === 0) return prevQueue;

      // Sort by priority and timestamp
      const sortedQueue = [...prevQueue].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      const nextAnnouncement = sortedQueue[0];
      const remainingQueue = sortedQueue.slice(1);

      setCurrentAnnouncement(nextAnnouncement);

      // Clear the announcement after a delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCurrentAnnouncement(null);
        // Process next announcement after a short delay
        setTimeout(() => processQueue(), 100);
      }, 3000); // Keep announcement for 3 seconds

      return remainingQueue;
    });
  }, []);

  // Add announcement to queue
  const announce = useCallback((
    message: string, 
    options: AnnouncementOptions = {}
  ) => {
    const {
      politeness = 'polite',
      priority = 'medium'
    } = options;

    // Prevent duplicate announcements within a short time frame
    const messageKey = message.toLowerCase().trim();
    const now = Date.now();
    const lastCount = announcementCountRef.current.get(messageKey) || 0;
    const timeSinceLastAnnouncement = now - lastCount;

    // If the same message was announced recently, skip it
    if (timeSinceLastAnnouncement < 2000) {
      return;
    }

    announcementCountRef.current.set(messageKey, now);

    // Clean up old entries from the count map
    for (const [key, timestamp] of announcementCountRef.current.entries()) {
      if (now - timestamp > 10000) { // Remove entries older than 10 seconds
        announcementCountRef.current.delete(key);
      }
    }

    const announcement: Announcement = {
      id: `announcement-${now}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      politeness,
      timestamp: now,
      priority
    };

    setQueue(prevQueue => [...prevQueue, announcement]);

    // If no current announcement, process immediately
    if (!currentAnnouncement) {
      setTimeout(processQueue, 0);
    }
  }, [currentAnnouncement, processQueue]);

  // Announce success messages
  const announceSuccess = useCallback((message: string) => {
    announce(`Succès: ${message}`, { politeness: 'polite', priority: 'medium' });
  }, [announce]);

  // Announce error messages
  const announceError = useCallback((message: string) => {
    announce(`Erreur: ${message}`, { politeness: 'assertive', priority: 'high' });
  }, [announce]);

  // Announce loading states
  const announceLoading = useCallback((message: string = 'Chargement en cours') => {
    announce(message, { politeness: 'polite', priority: 'low' });
  }, [announce]);

  // Announce navigation changes
  const announceNavigation = useCallback((message: string) => {
    announce(`Navigation: ${message}`, { politeness: 'polite', priority: 'medium' });
  }, [announce]);

  // Announce form validation errors
  const announceValidationError = useCallback((fieldName: string, error: string) => {
    announce(`Erreur de validation pour ${fieldName}: ${error}`, { 
      politeness: 'assertive', 
      priority: 'high' 
    });
  }, [announce]);

  // Announce dynamic content changes
  const announceContentChange = useCallback((message: string) => {
    announce(`Contenu mis à jour: ${message}`, { politeness: 'polite', priority: 'low' });
  }, [announce]);

  // Clear all announcements
  const clearAnnouncements = useCallback(() => {
    setCurrentAnnouncement(null);
    setQueue([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    announce,
    announceSuccess,
    announceError,
    announceLoading,
    announceNavigation,
    announceValidationError,
    announceContentChange,
    clearAnnouncements,
    currentAnnouncement,
    queueLength: queue.length
  };
}

// Context for sharing announcements across components
import React, { createContext, useContext } from 'react';

const ScreenReaderContext = createContext<ReturnType<typeof useScreenReaderAnnouncements> | null>(null);

export function ScreenReaderProvider({ children }: { children: React.ReactNode }) {
  const announcements = useScreenReaderAnnouncements();

  return (
    <ScreenReaderContext.Provider value={announcements}>
      {children}
      {/* Render the live region */}
      {announcements.currentAnnouncement && (
        <div
          aria-live={announcements.currentAnnouncement.politeness}
          aria-atomic="true"
          className="sr-only"
          role={announcements.currentAnnouncement.politeness === 'assertive' ? 'alert' : 'status'}
        >
          {announcements.currentAnnouncement.message}
        </div>
      )}
    </ScreenReaderContext.Provider>
  );
}

export function useScreenReader() {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within a ScreenReaderProvider');
  }
  return context;
}
