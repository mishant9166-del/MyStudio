import React, { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export const RecordingSettings: React.FC<Props> = ({ onClose }) => {
  const [outputFolder, setOutputFolder] = useState('D:\\Videos');
  const [format, setFormat] = useState('mp4');
  const [videoEncoder, setVideoEncoder] = useState('auto');
  const [resolution, setResolution] = useState('1920x1080');
  const [fps, setFps] = useState('30');
  const [quality, setQuality] = useState('high');

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('videoStudio_recordingSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.outputFolder) setOutputFolder(parsed.outputFolder);
        if (parsed.format) setFormat(parsed.format);
        if (parsed.videoEncoder) setVideoEncoder(parsed.videoEncoder);
        if (parsed.resolution) setResolution(parsed.resolution);
        if (parsed.fps) setFps(parsed.fps.toString());
        if (parsed.quality) setQuality(parsed.quality);
      } catch (e) {
        console.error('Failed to parse recording settings', e);
      }
    }
  }, []);

  const handleBrowse = async () => {
    const folder = await window.electronAPI.selectOutputFolder();
    if (folder) {
      setOutputFolder(folder);
    }
  };

  const handleSave = () => {
    // Map quality to bitrates
    let vBitrate = 8000;
    let aBitrate = 160;
    if (quality === 'balanced') { vBitrate = 5000; aBitrate = 128; }
    if (quality === 'very_high') { vBitrate = 15000; aBitrate = 256; }

    const resParts = resolution.split('x');

    const settings = {
      outputFolder,
      format,
      videoEncoder,
      resolution: { width: parseInt(resParts[0]), height: parseInt(resParts[1]) },
      fps: parseInt(fps),
      videoBitrateKbps: vBitrate,
      audioBitrateKbps: aBitrate,
      quality // save for UI
    };

    localStorage.setItem('videoStudio_recordingSettings', JSON.stringify(settings));
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center">
          <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
          Recording Settings
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Output Folder */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Output Folder</label>
          <div className="flex gap-2">
            <input 
              type="text"
              readOnly
              value={outputFolder}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none"
            />
            <button 
              onClick={handleBrowse}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded transition-colors"
            >
              Browse
            </button>
          </div>
        </div>

        {/* Format & Encoder */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Format</label>
            <select 
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            >
              <option value="mp4">MP4</option>
              <option value="mkv" disabled>MKV (Coming Soon)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video Encoder</label>
            <select 
              value={videoEncoder}
              onChange={e => setVideoEncoder(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            >
              <option value="auto">Auto (Hardware preferred)</option>
              <option value="software">Software (x264)</option>
            </select>
          </div>
        </div>

        {/* Resolution & FPS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution</label>
            <select 
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            >
              <option value="1920x1080">1920 × 1080</option>
              <option value="1280x720">1280 × 720</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">FPS</label>
            <select 
              value={fps}
              onChange={e => setFps(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            >
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="24">24</option>
            </select>
          </div>
        </div>

        {/* Quality Preset */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video Quality</label>
          <select 
            value={quality}
            onChange={e => setQuality(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
          >
            <option value="balanced">Balanced (5 Mbps)</option>
            <option value="high">High (8 Mbps)</option>
            <option value="very_high">Very High (15 Mbps)</option>
          </select>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className="w-full bg-[#00B4FF] hover:bg-cyan-500 text-white font-semibold py-2.5 rounded text-sm transition-colors shadow-sm"
        >
          Save Settings
        </button>

      </div>
    </div>
  );
};
