import React from 'react';
import { useSessionManager } from '@/hooks/useSessionManager';

interface SessionManagerProviderProps {
  children: React.ReactNode;
  checkInterval?: number;
  cleanupInterval?: number;
  maxRetries?: number;
}

const SessionManagerProvider: React.FC<SessionManagerProviderProps> = ({ 
  children, 
  checkInterval,
  cleanupInterval, 
  maxRetries 
}) => {
  // Initialize session manager with custom config
  useSessionManager({
    checkInterval,
    cleanupInterval,
    maxRetries
  });

  return <>{children}</>;
};

export default SessionManagerProvider;