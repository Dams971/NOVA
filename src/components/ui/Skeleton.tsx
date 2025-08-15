import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export function SkeletonText({ 
  lines = 1, 
  className = '' 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`} aria-hidden="true">
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={3} />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`} aria-hidden="true">
      {/* Form title */}
      <Skeleton className="h-8 w-2/3" />
      
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      
      {/* Action buttons */}
      <div className="flex space-x-3">
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-12 w-20" />
      </div>
    </div>
  );
}

export function SkeletonCalendar({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`} aria-hidden="true">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-6" />
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Weekday headers */}
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={`header-${index}`} className="h-4 w-full" />
        ))}
        
        {/* Calendar days */}
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={`day-${index}`} className="h-10 w-10 rounded-md" />
        ))}
      </div>
    </div>
  );
}