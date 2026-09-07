import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Fallback for UI development in a regular web browser
if (!window.electronAPI) {
  window.electronAPI = {
    getCameras: async () => [{ id: 'mock-cam', name: 'Mock Camera' }],
    getDisplays: async () => [{ id: 'mock-disp', name: 'Mock Display', width: 1920, height: 1080, isPrimary: true }],
    startCamera: async () => true,
    stopCamera: async () => {},
    startScreen: async () => true,
    stopScreen: async () => {},
    onVideoFrame: () => {},
    removeVideoFrameListener: () => {},
    
    getAudioInputDevices: async () => [{ id: 'mock-mic', name: 'Mock Microphone' }],
    getAudioOutputDevices: async () => [{ id: 'mock-speaker', name: 'Mock Speaker' }],
    addAudioSource: async () => true,
    removeAudioSource: async () => {},
    setAudioVolume: async () => {},
    setAudioMute: async () => {},
    setAudioSolo: async () => {},
    setAudioMonitoring: async () => true,
    onAudioMeters: () => {},
    removeAudioMetersListener: () => {},

    selectImageFile: async () => null,
    selectDocumentFile: async () => null,
    readImageFile: async () => null,
    readDocumentFile: async () => null,

    startVirtualCamera: async () => true,
    stopVirtualCamera: async () => true,

    stopRecording: async () => {},
    selectRecordingFolder: async () => 'C:\\Mock\\Recordings',
    updateRecordingLayout: async () => {},

    saveStreamingSettings: async () => true,
    loadStreamingSettings: async () => ({}),

    getPicturesPath: async () => 'C:\\Users\\MockUser\\Pictures\\MyStudio',
    selectOutputFolder: async () => 'C:\\Mock\\Output\\Folder',
    startRecording: async () => true,
    stopStreaming: async () => true,

    updateSourceFilters: async () => true,
    saveSnapshot: async () => true
  } as any;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
