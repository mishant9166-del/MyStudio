import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RecordingSettings } from '../../../../shared/types';

interface RecordingContextType {
  isRecording: boolean;
  recordingTime: number; // in seconds
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);


  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    // Read latest settings
    const saved = localStorage.getItem('videoStudio_recordingSettings');
    let settings: RecordingSettings = {
      outputFolder: 'D:\\Videos',
      format: 'mp4',
      videoEncoder: 'auto',
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      videoBitrateKbps: 8000,
      audioBitrateKbps: 160
    };
    if (saved) {
      try {
        settings = { ...settings, ...JSON.parse(saved) };
      } catch (e) {}
    }

    // Generate filename
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const filename = `VideoStudio_${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.${settings.format}`;
    const fullPath = `${settings.outputFolder}\\${filename}`;

    const success = await window.electronAPI.startRecording(fullPath, settings);
    if (success) {
      setIsRecording(true);
    } else {
      alert('Failed to start recording. Please check settings and permissions.');
    }
  };

  const stopRecording = async () => {
    await window.electronAPI.stopRecording();
    setIsRecording(false);
  };

  return (
    <RecordingContext.Provider value={{ isRecording, recordingTime, startRecording, stopRecording }}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error('useRecording must be used within RecordingProvider');
  return ctx;
};
