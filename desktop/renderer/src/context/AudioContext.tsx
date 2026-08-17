import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { AudioDevice, AudioSource, AudioSourceType } from '../../../../shared/types';

interface AudioState {
  sources: AudioSource[];
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  monitorDeviceId: string | null;
}

type AudioAction = 
  | { type: 'SET_DEVICES'; payload: { inputs: AudioDevice[], outputs: AudioDevice[] } }
  | { type: 'ADD_SOURCE'; payload: { sourceId: string; deviceId: string; type: AudioSourceType; name: string } }
  | { type: 'REMOVE_SOURCE'; payload: { sourceId: string } }
  | { type: 'SET_VOLUME'; payload: { sourceId: string; volumeDb: number } }
  | { type: 'SET_MUTE'; payload: { sourceId: string; muted: boolean } }
  | { type: 'SET_SOLO'; payload: { sourceId: string; solo: boolean } }
  | { type: 'SET_MONITOR_DEVICE'; payload: { deviceId: string } };

const initialState: AudioState = {
  sources: [],
  inputDevices: [],
  outputDevices: [],
  monitorDeviceId: null
};

// Hydrate from localStorage
const loadState = (): AudioState => {
  try {
    const saved = localStorage.getItem('audio_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // We only restore sources and monitor device. Devices list is fetched live.
      return { ...initialState, sources: parsed.sources || [], monitorDeviceId: parsed.monitorDeviceId };
    }
  } catch (e) {
    console.error('Failed to parse audio_state', e);
  }
  return initialState;
};

const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'SET_DEVICES':
      return { ...state, inputDevices: action.payload.inputs, outputDevices: action.payload.outputs };
    
    case 'ADD_SOURCE': {
      if (state.sources.find(s => s.deviceId === action.payload.deviceId)) return state; // Prevent duplicates
      const newSource: AudioSource = {
        id: action.payload.sourceId,
        type: action.payload.type,
        name: action.payload.name,
        deviceId: action.payload.deviceId,
        volume: 0,
        muted: false,
        solo: false
      };
      
      // Tell native engine
      window.electronAPI.addAudioSource(newSource.id, newSource.deviceId, newSource.type === 'desktop').catch(console.error);
      
      return { ...state, sources: [...state.sources, newSource] };
    }

    case 'REMOVE_SOURCE': {
      window.electronAPI.removeAudioSource(action.payload.sourceId).catch(console.error);
      return { ...state, sources: state.sources.filter(s => s.id !== action.payload.sourceId) };
    }

    case 'SET_VOLUME': {
      window.electronAPI.setAudioVolume(action.payload.sourceId, action.payload.volumeDb).catch(console.error);
      return {
        ...state,
        sources: state.sources.map(s => s.id === action.payload.sourceId ? { ...s, volume: action.payload.volumeDb } : s)
      };
    }

    case 'SET_MUTE': {
      window.electronAPI.setAudioMute(action.payload.sourceId, action.payload.muted).catch(console.error);
      return {
        ...state,
        sources: state.sources.map(s => s.id === action.payload.sourceId ? { ...s, muted: action.payload.muted } : s)
      };
    }

    case 'SET_SOLO': {
      window.electronAPI.setAudioSolo(action.payload.sourceId, action.payload.solo).catch(console.error);
      return {
        ...state,
        sources: state.sources.map(s => s.id === action.payload.sourceId ? { ...s, solo: action.payload.solo } : s)
      };
    }

    case 'SET_MONITOR_DEVICE': {
      window.electronAPI.setAudioMonitoring(action.payload.deviceId).catch(console.error);
      return { ...state, monitorDeviceId: action.payload.deviceId };
    }

    default:
      return state;
  }
};

const AudioContext = createContext<{
  state: AudioState;
  dispatch: React.Dispatch<AudioAction>;
} | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState, loadState);

  // Save to localStorage when sources or monitor config changes
  useEffect(() => {
    localStorage.setItem('audio_state', JSON.stringify({
      sources: state.sources,
      monitorDeviceId: state.monitorDeviceId
    }));
  }, [state.sources, state.monitorDeviceId]);

  // Initial setup: Fetch devices and restart native sources
  useEffect(() => {
    Promise.all([
      window.electronAPI.getAudioInputDevices(),
      window.electronAPI.getAudioOutputDevices()
    ]).then(([inputs, outputs]) => {
      dispatch({ type: 'SET_DEVICES', payload: { inputs, outputs } });
      
      // Resurrect saved sources in native engine
      state.sources.forEach(source => {
        // Native engine expects to know if it's desktop loopback or standard mic
        window.electronAPI.addAudioSource(source.id, source.deviceId, source.type === 'desktop');
        window.electronAPI.setAudioVolume(source.id, source.volume);
        window.electronAPI.setAudioMute(source.id, source.muted);
        window.electronAPI.setAudioSolo(source.id, source.solo);
      });
      
      if (state.monitorDeviceId) {
        window.electronAPI.setAudioMonitoring(state.monitorDeviceId);
      }
    }).catch(console.error);
  }, []);

  return (
    <AudioContext.Provider value={{ state, dispatch }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
