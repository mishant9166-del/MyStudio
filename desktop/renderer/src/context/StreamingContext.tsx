import React, { createContext, useContext, useState, useEffect } from 'react';

interface StreamingContextType {
  isStreaming: boolean;
  streamTime: number; // in seconds
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<void>;
}

const StreamingContext = createContext<StreamingContextType | null>(null);

export const StreamingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTime, setStreamTime] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamTime(prev => prev + 1);
      }, 1000);
    } else {
      setStreamTime(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const startStreaming = async () => {
    // Prompt the user for a new key if they haven't saved one, but usually it's saved.
    // For now we'll pass undefined to rely on the saved key in main process.
    const success = await window.electronAPI.startStreaming('');
    if (success) {
      setIsStreaming(true);
    } else {
      alert('Failed to start streaming. Check your stream key and server URL, and ensure the server is reachable.');
    }
  };

  const stopStreaming = async () => {
    await window.electronAPI.stopStreaming();
    setIsStreaming(false);
  };

  return (
    <StreamingContext.Provider value={{ isStreaming, streamTime, startStreaming, stopStreaming }}>
      {children}
    </StreamingContext.Provider>
  );
};

export const useStreaming = () => {
  const ctx = useContext(StreamingContext);
  if (!ctx) throw new Error('useStreaming must be used within StreamingProvider');
  return ctx;
};
