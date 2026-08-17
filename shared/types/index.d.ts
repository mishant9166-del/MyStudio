export interface CameraDevice {
  id: string;
  name: string;
}

export interface DisplayDevice {
  id: string;
  name: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

// --------------------------------------------------------
// TRANSFORM & CROP
// --------------------------------------------------------
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
}

export interface Crop {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// --------------------------------------------------------
// SOURCES
// --------------------------------------------------------
export type SourceType = 'camera' | 'screen' | 'image' | 'text' | 'pdf' | 'powerpoint';

export interface BaseSource {
  id: string;
  type: SourceType;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  transform: Transform;
  crop: Crop;
  opacity: number; // 0 to 1
}

export interface CameraSource extends BaseSource {
  type: 'camera';
  deviceId: string;
}

export interface ScreenSource extends BaseSource {
  type: 'screen';
  displayId: string;
}

export interface ImageSource extends BaseSource {
  type: 'image';
  filePath: string;
}

export interface PdfSource extends BaseSource {
  type: 'pdf';
  file?: string;
  currentPage?: number;
  totalPages?: number;
}

export interface PowerPointSource extends BaseSource {
  type: 'powerpoint';
  file?: string;
}

export interface TextSource extends BaseSource {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
}

export type SceneSource = CameraSource | ScreenSource | ImageSource | TextSource | PdfSource | PowerPointSource;

// --------------------------------------------------------
// SCENES
// --------------------------------------------------------
export interface Scene {
  id: string;
  name: string;
  sources: SceneSource[];
}

export interface AppState {
  scenes: Scene[];
  activeSceneId: string | null;
}

// --------------------------------------------------------
// IPC / NATIVE BRIDGE
// --------------------------------------------------------
declare global {
  interface Window {
    electronAPI: {
      getCameras: () => Promise<CameraDevice[]>;
      getDisplays: () => Promise<DisplayDevice[]>;
      
      // We pass the specific source ID so we can route frames to the correct visual element
      startCamera: (deviceId: string, sourceId: string) => Promise<boolean>;
      stopCamera: (sourceId: string) => Promise<void>;
      
      startScreen: (displayId: string, sourceId: string) => Promise<boolean>;
      stopScreen: (sourceId: string) => Promise<void>;
      
      // Receive frames targeted for a specific source ID
      onVideoFrame: (sourceId: string, callback: (buffer: Uint8Array, width: number, height: number) => void) => void;
      removeVideoFrameListener: (sourceId: string) => void;

      // Utilities for Image/Document source
      selectImageFile: () => Promise<string | null>;
      selectDocumentFile: () => Promise<string | null>;
      readImageFile: (filePath: string) => Promise<string | null>; // Returns base64 or object URL for local images
      readDocumentFile: (filePath: string) => Promise<string | null>; // Returns base64 buffer string
      
      // Audio IPC
      getAudioInputDevices: () => Promise<AudioDevice[]>;
      getAudioOutputDevices: () => Promise<AudioDevice[]>;
      addAudioSource: (sourceId: string, deviceId: string, isDesktop: boolean) => Promise<boolean>;
      removeAudioSource: (sourceId: string) => Promise<void>;
      setAudioVolume: (sourceId: string, volumeDb: number) => Promise<void>;
      setAudioMute: (sourceId: string, muted: boolean) => Promise<void>;
      setAudioSolo: (sourceId: string, solo: boolean) => Promise<void>;
      setAudioMonitoring: (deviceId: string) => Promise<boolean>;
      onAudioMeters: (callback: (meters: AudioMeter[]) => void) => void;
      removeAudioMetersListener: () => void;
      
      // Recording IPC
      selectOutputFolder: () => Promise<string | null>;
      startRecording: (path: string, settings: RecordingSettings) => Promise<boolean>;
      stopRecording: () => Promise<void>;
      updateRecordingLayout: (layoutJson: string) => Promise<void>;

      // Streaming IPC
      saveStreamingSettings: (settings: any) => Promise<boolean>;
      loadStreamingSettings: () => Promise<any>;
      startStreaming: (streamKey: string) => Promise<boolean>;
      stopStreaming: () => Promise<void>;

      // Virtual Camera IPC
      startVirtualCamera: () => Promise<boolean>;
      stopVirtualCamera: () => Promise<void>;

      // Filters IPC
      updateSourceFilters: (sourceId: string, filters: any[]) => Promise<void>;
    };
  }
}

// --------------------------------------------------------
// RECORDING TYPES
// --------------------------------------------------------
export interface RecordingSettings {
  outputFolder: string;
  format: 'mp4' | 'mkv';
  videoEncoder: 'auto' | 'software';
  resolution: { width: number; height: number };
  fps: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
}


// --------------------------------------------------------
// AUDIO TYPES
// --------------------------------------------------------
export interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface AudioMeter {
  id: string;
  rms: number;     // e.g. -18.5 dB
  peak: number;    // e.g. -3.2 dB
  clipping: boolean;
}

export type AudioSourceType = 'mic' | 'desktop';

export interface AudioSource {
  id: string;
  type: AudioSourceType;
  name: string;
  deviceId: string;
  volume: number; // Volume in dB (e.g. 0 is unity, -60 is silent)
  muted: boolean;
  solo: boolean;
}
