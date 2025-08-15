'use client';

import React from 'react';

/**
 * NOVA Loading Spinner Components
 * Various loading indicators for the chat interface
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', color = '#3b82f6', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        className="animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          fill="currentColor"
          fillOpacity="0.75"
        />
      </svg>
    </div>
  );
}

export function TypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm text-gray-500 ml-2">Nova écrit...</span>
    </div>
  );
}

export function MessageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );
}

export function ConnectionIndicator({ 
  status, 
  className = '' 
}: { 
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  className?: string;
}) {
  const statusConfig = {
    connecting: {
      color: 'bg-yellow-400',
      text: 'Connexion...',
      animate: 'animate-pulse'
    },
    connected: {
      color: 'bg-green-400',
      text: 'Connecté',
      animate: ''
    },
    disconnected: {
      color: 'bg-red-400',
      text: 'Déconnecté',
      animate: 'animate-pulse'
    },
    error: {
      color: 'bg-red-500',
      text: 'Erreur',
      animate: 'animate-pulse'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.animate}`}></div>
      <span className="text-xs text-gray-600">{config.text}</span>
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  color?: string;
  animated?: boolean;
}

export function ProgressBar({ 
  progress, 
  className = '', 
  color = 'bg-blue-500',
  animated = false 
}: ProgressBarProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-300 ease-out ${color} ${
          animated ? 'animate-pulse' : ''
        }`}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      ></div>
    </div>
  );
}

export function PulsingDot({ 
  color = 'bg-blue-500', 
  size = 'w-3 h-3',
  className = '' 
}: {
  color?: string;
  size?: string;
  className?: string;
}) {
  return (
    <div className={`${size} ${color} rounded-full animate-pulse ${className}`}></div>
  );
}

export default LoadingSpinner;