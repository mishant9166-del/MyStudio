import React, { createContext, useContext, useState } from 'react';

interface VirtualCameraContextType {
  isVCamActive: boolean;
  startVirtualCamera: () => Promise<void>;
  stopVirtualCamera: () => Promise<void>;
}

const VirtualCameraContext = createContext<VirtualCameraContextType | null>(null);

export const VirtualCameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVCamActive, setIsVCamActive] = useState(false);

  const startVirtualCamera = async () => {
    const success = await window.electronAPI.startVirtualCamera();
    if (success) {
      setIsVCamActive(true);
    } else {
      alert('Failed to start Virtual Camera. Make sure the driver is installed and registered.');
    }
  };

  const stopVirtualCamera = async () => {
    await window.electronAPI.stopVirtualCamera();
    setIsVCamActive(false);
  };

  return (
    <VirtualCameraContext.Provider value={{ isVCamActive, startVirtualCamera, stopVirtualCamera }}>
      {children}
    </VirtualCameraContext.Provider>
  );
};

export const useVirtualCamera = () => {
  const ctx = useContext(VirtualCameraContext);
  if (!ctx) throw new Error('useVirtualCamera must be used within VirtualCameraProvider');
  return ctx;
};
