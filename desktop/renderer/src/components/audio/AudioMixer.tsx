import React, { useState } from 'react';
import { PanelContainer, PanelSection, PanelDropdown, PanelSlider } from '../ui/PanelComponents';
import { VolumeX, Volume2, X, SkipBack, Play, SkipForward, Repeat, Maximize2, ListPlus, Save, Trash2, Mic } from 'lucide-react';

export const AudioMixer = () => {
  const [globalSound, setGlobalSound] = useState(true);
  const [presetAudio, setPresetAudio] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(false);
  const [audioMonitoring, setAudioMonitoring] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(-25);
  const [micVolume, setMicVolume] = useState(70);
  const [playlistVolume, setPlaylistVolume] = useState(40);

  return (
    <PanelContainer>
      <PanelSection title="Global Sound" toggle={globalSound} onToggle={setGlobalSound} />
      <PanelSection title="Preset Audio" toggle={presetAudio} onToggle={setPresetAudio} headerRight={<div className="text-orange-400 w-3 h-3 grid grid-cols-2 gap-0.5"><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div></div>} />
      
      <PanelSection title="Audio Playback Device">
        <PanelDropdown value="Default playback device" options={['Default playback device', 'Speakers (Realtek)', 'Headphones']} />
      </PanelSection>

      <PanelSection title="Noise Suppression" toggle={noiseSuppression} onToggle={setNoiseSuppression}>
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-[11px] text-slate-500 w-6">0 dB</span>
          <input type="range" className="flex-1 h-1 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" min="-50" max="0" value={noiseLevel} onChange={(e) => setNoiseLevel(Number(e.target.value))} />
          <span className="text-[11px] text-slate-500 w-10 text-right">-50 dB</span>
        </div>
      </PanelSection>

      <PanelSection title="Audio Monitoring" toggle={audioMonitoring} onToggle={setAudioMonitoring}>
        <p className="text-[11px] text-slate-500 mt-1 pr-4">Listen to the sounds from your microphones</p>
      </PanelSection>

      <PanelSection title="Audio Inputs">
        <div className="border border-slate-200 rounded text-[13px]">
          <div className="flex items-center justify-between p-2 border-b border-slate-200">
            <span className="truncate text-slate-600">ne Array (Intel® Smart So...</span>
            <button className="text-red-500 hover:text-red-600 shrink-0 ml-2">
              <div className="bg-red-500 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </div>
            </button>
          </div>
          <div className="flex items-center p-2 space-x-2 bg-slate-50">
            <VolumeX className="w-4 h-4 text-slate-400" />
            <input type="range" className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" value={micVolume} onChange={(e) => setMicVolume(Number(e.target.value))} />
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        
        <button className="w-full mt-4 py-2 bg-[#00B4FF] hover:bg-[#009ce0] text-white rounded font-medium transition-colors">
          Add Audio Device (mic)
        </button>
      </PanelSection>

      <PanelSection title="Audio Playlist" headerRight={<Mic className="w-4 h-4 text-slate-400" />}>
        <div className="border border-slate-200 rounded p-3 flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input type="range" className="flex-1 h-1 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" value={playlistVolume} onChange={(e) => setPlaylistVolume(Number(e.target.value))} />
        </div>

        <div className="flex items-center justify-between mt-3 space-x-1">
          <button className="flex-1 py-1.5 border border-slate-200 rounded flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <SkipBack className="w-4 h-4" />
          </button>
          <button className="flex-1 py-1.5 border border-slate-200 rounded flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <Play className="w-4 h-4 fill-current" />
          </button>
          <button className="flex-1 py-1.5 border border-slate-200 rounded flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <SkipForward className="w-4 h-4" />
          </button>
          <button className="flex-1 py-1.5 border border-slate-200 rounded flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <Repeat className="w-4 h-4" />
          </button>
          <button className="flex-1 py-1.5 border border-slate-200 rounded flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 mb-2">
          <span className="text-[12px] font-semibold text-slate-500">No audio playing</span>
          <div className="flex space-x-2 text-slate-400">
            <ListPlus className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
            <Save className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
            <Trash2 className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
          </div>
        </div>

        <div className="bg-[#f0f9ff] rounded-lg border border-transparent py-8 flex flex-col items-center justify-center text-slate-500">
          <div className="w-12 h-12 bg-slate-200/50 rounded-full flex items-center justify-center mb-2">
            <ListPlus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-[13px]">This playlist is empty.</p>
        </div>
      </PanelSection>
      
      <div className="h-8"></div>
    </PanelContainer>
  );
};

// Helper for the chevron inside the inputs volume control
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
