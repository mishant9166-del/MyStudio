import { contextBridge, ipcRenderer } from 'electron';
import type { AudioDevice, AudioMeter } from '../../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Device Enumeration
  getCameras: () => ipcRenderer.invoke('camera:list'),
  getDisplays: () => ipcRenderer.invoke('display:list'),
  
  // Capture Control
  startCamera: (deviceId: string, sourceId: string) => ipcRenderer.invoke('camera:start', deviceId, sourceId),
  stopCamera: (sourceId: string) => ipcRenderer.invoke('camera:stop', sourceId),
  startScreen: (displayId: string, sourceId: string) => ipcRenderer.invoke('display:start', displayId, sourceId),
  stopScreen: (sourceId: string) => ipcRenderer.invoke('display:stop', sourceId),
  
  // Video Frame Streaming (Binary)
  onVideoFrame: (sourceId: string, callback: (buffer: Uint8Array, width: number, height: number) => void) => {
    ipcRenderer.removeAllListeners(`video:frame:${sourceId}`);
    ipcRenderer.on(`video:frame:${sourceId}`, (_event, buffer, width, height) => {
      callback(buffer, width, height);
    });
  },
  removeVideoFrameListener: (sourceId: string) => {
    ipcRenderer.removeAllListeners(`video:frame:${sourceId}`);
  },

  // Image Utilities
  selectImageFile: () => ipcRenderer.invoke('image:select'),
  selectDocumentFile: () => ipcRenderer.invoke('document:select'),
  readDocumentFile: (filePath: string) => ipcRenderer.invoke('document:read', filePath),
  readImageFile: (filePath: string) => ipcRenderer.invoke('image:read', filePath),

  // --- Audio IPC ---
  getAudioInputDevices: () => ipcRenderer.invoke('audio:list-inputs'),
  getAudioOutputDevices: () => ipcRenderer.invoke('audio:list-outputs'),
  
  addAudioSource: (sourceId: string, deviceId: string, isDesktop: boolean) => 
    ipcRenderer.invoke('audio:add-source', sourceId, deviceId, isDesktop),
    
  removeAudioSource: (sourceId: string) => ipcRenderer.invoke('audio:remove-source', sourceId),
  setAudioVolume: (sourceId: string, volumeDb: number) => ipcRenderer.invoke('audio:set-volume', sourceId, volumeDb),
  setAudioMute: (sourceId: string, muted: boolean) => ipcRenderer.invoke('audio:set-mute', sourceId, muted),
  setAudioSolo: (sourceId: string, solo: boolean) => ipcRenderer.invoke('audio:set-solo', sourceId, solo),
  setAudioMonitoring: (deviceId: string) => ipcRenderer.invoke('audio:set-monitoring', deviceId),
  
  onAudioMeters: (callback: (meters: AudioMeter[]) => void) => {
    ipcRenderer.removeAllListeners('audio:meters');
    ipcRenderer.on('audio:meters', (_event, meters: AudioMeter[]) => callback(meters));
  },
  removeAudioMetersListener: () => {
    ipcRenderer.removeAllListeners('audio:meters');
  },

  // ----------------------------------------------------
  // RECORDING
  // ----------------------------------------------------
  selectOutputFolder: () => ipcRenderer.invoke('recording:select-folder'),
  startRecording: (path: string, settings: any) => ipcRenderer.invoke('recording:start', path, settings),
  stopRecording: () => ipcRenderer.invoke('recording:stop'),
  updateRecordingLayout: (layoutJson: string) => ipcRenderer.invoke('recording:update-layout', layoutJson),

  // ----------------------------------------------------
  // STREAMING
  // ----------------------------------------------------
  saveStreamingSettings: (settings: any) => ipcRenderer.invoke('streaming:save-settings', settings),
  loadStreamingSettings: () => ipcRenderer.invoke('streaming:load-settings'),
  startStreaming: (streamKey: string) => ipcRenderer.invoke('streaming:start', streamKey),
  stopStreaming: () => ipcRenderer.invoke('streaming:stop'),

  // ----------------------------------------------------
  // VIRTUAL CAMERA
  // ----------------------------------------------------
  startVirtualCamera: () => ipcRenderer.invoke('vcam:start'),
  stopVirtualCamera: () => ipcRenderer.invoke('vcam:stop'),

  // ----------------------------------------------------
  // FILTERS
  // ----------------------------------------------------
  updateSourceFilters: (sourceId: string, filters: any[]) => ipcRenderer.invoke('filters:update', sourceId, filters),
});
