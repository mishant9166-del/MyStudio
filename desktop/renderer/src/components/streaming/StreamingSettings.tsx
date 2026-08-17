import React, { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export const StreamingSettings: React.FC<Props> = ({ onClose }) => {
  const [platform, setPlatform] = useState('custom');
  const [serverUrl, setServerUrl] = useState('rtmp://a.rtmp.youtube.com/live2');
  const [streamKey, setStreamKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [videoBitrate, setVideoBitrate] = useState('6000');
  const [audioBitrate, setAudioBitrate] = useState('160');
  const [resolution, setResolution] = useState('1920x1080');
  const [fps, setFps] = useState('30');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved streaming settings from Main process
    window.electronAPI.loadStreamingSettings().then((settings: any) => {
      if (settings) {
        if (settings.platform) setPlatform(settings.platform);
        if (settings.serverUrl) setServerUrl(settings.serverUrl);
        if (settings.videoBitrateKbps) setVideoBitrate(settings.videoBitrateKbps.toString());
        if (settings.audioBitrateKbps) setAudioBitrate(settings.audioBitrateKbps.toString());
        if (settings.resolution) setResolution(`${settings.resolution.width}x${settings.resolution.height}`);
        if (settings.fps) setFps(settings.fps.toString());
        if (settings.hasKey) setHasSavedKey(true);
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const resParts = resolution.split('x');

    const settings = {
      platform,
      serverUrl,
      streamKey: streamKey || undefined, // Only pass if they typed a new one
      videoBitrateKbps: parseInt(videoBitrate),
      audioBitrateKbps: parseInt(audioBitrate),
      resolution: { width: parseInt(resParts[0]), height: parseInt(resParts[1]) },
      fps: parseInt(fps)
    };

    const success = await window.electronAPI.saveStreamingSettings(settings);
    setIsSaving(false);
    
    if (success) {
      if (streamKey) setHasSavedKey(true);
      setStreamKey(''); // Clear it out of state!
      onClose();
    } else {
      alert('Failed to save streaming settings.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center">
          <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Streaming Settings
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Destination */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination</label>
          <select 
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
          >
            <option value="custom">Custom RTMP</option>
            <option value="youtube">YouTube (RTMP)</option>
            <option value="twitch">Twitch</option>
          </select>
        </div>

        {/* Server URL */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Server URL</label>
          <input 
            type="text"
            value={serverUrl}
            onChange={e => setServerUrl(e.target.value)}
            placeholder="rtmp://..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
          />
        </div>

        {/* Stream Key */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stream Key</label>
          <div className="flex gap-2">
            <input 
              type={showKey ? "text" : "password"}
              value={streamKey}
              onChange={e => setStreamKey(e.target.value)}
              placeholder={hasSavedKey ? "******** (Saved Securely)" : "Enter stream key..."}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF] font-mono"
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors"
              title={showKey ? "Hide Key" : "Show Key"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showKey 
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /> 
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                }
                {!showKey && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Stored securely in OS Credential Manager.</p>
        </div>

        {/* Video & Audio Bitrate */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video Bitrate (Kbps)</label>
            <input 
              type="number"
              value={videoBitrate}
              onChange={e => setVideoBitrate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audio Bitrate (Kbps)</label>
            <select 
              value={audioBitrate}
              onChange={e => setAudioBitrate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            >
              <option value="128">128 Kbps</option>
              <option value="160">160 Kbps</option>
              <option value="320">320 Kbps</option>
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
            </select>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded text-sm transition-colors shadow-sm"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

      </div>
    </div>
  );
};
