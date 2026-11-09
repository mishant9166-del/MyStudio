import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRecording } from '../../context/RecordingContext';
import { useStreaming } from '../../context/StreamingContext';
import { useVirtualCamera } from '../../context/VirtualCameraContext';
import { MoreVertical, ListVideo, Video, Radio, Camera, MicOff, Maximize, Grid2X2, MonitorOff, Settings } from 'lucide-react';

const SHUTTER_AUDIO = new Audio('/mixkit-camera-shutter-hard-click-1430.wav');

export const Controls = ({ onOpenSettings }: { onOpenSettings: () => void }) => {
  const { isRecording, startRecording, stopRecording } = useRecording();
  const { isStreaming, startStreaming, stopStreaming } = useStreaming();
  const { isVCamActive, startVirtualCamera, stopVirtualCamera } = useVirtualCamera();

  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleTakeSnapshot = () => {
    const delayStr = localStorage.getItem('mystudio_shutter_delay') || '0';
    const delay = parseInt(delayStr, 10);

    if (delay > 0) {
      setCountdown(delay);
      let current = delay;
      const interval = setInterval(() => {
        current -= 1;
        if (current > 0) {
          setCountdown(current);
        } else {
          clearInterval(interval);
          setCountdown(null);
          executeSnapshot();
        }
      }, 1000);
    } else {
      executeSnapshot();
    }
  };

  const executeSnapshot = async () => {
    const playSound = localStorage.getItem('mystudio_shutter_sound') !== 'false';
    if (playSound) {
      SHUTTER_AUDIO.currentTime = 0;
      SHUTTER_AUDIO.play().catch(e => console.error("Audio play failed:", e));
    }

    // Dispatch event to PreviewArea.tsx so it renders the animation correctly within the letterboxed canvas bounds
    window.dispatchEvent(new CustomEvent('play-shutter-animation'));

    const prefix = localStorage.getItem('mystudio_snapshot_prefix') || 'My Snapshot';

    // Save actual image file
    const canvas = document.getElementById('main-preview-canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      let folderPath = localStorage.getItem('mystudio_snapshot_path');
      if (!folderPath && (window as any).electronAPI?.getPicturesPath) {
        folderPath = await (window as any).electronAPI.getPicturesPath();
      }
      folderPath = folderPath || 'C:\\Pictures\\MyStudio';

      const copyPathsStr = localStorage.getItem('mystudio_copy_paths');
      const copyPaths = copyPathsStr ? JSON.parse(copyPathsStr) : [];
      const isSaveCopyEnabled = localStorage.getItem('mystudio_save_copy') === 'true';
      const activeCopyPaths = isSaveCopyEnabled ? copyPaths : [];

      if ((window as any).electronAPI?.saveSnapshot) {
        try {
          const savedFileName = await (window as any).electronAPI.saveSnapshot(dataUrl, folderPath, prefix, activeCopyPaths);
          if (savedFileName) {
            setToastMessage(`Saved: ${savedFileName}`);
            setTimeout(() => setToastMessage(null), 3000);
            window.dispatchEvent(new CustomEvent('snapshot-taken'));
          }
        } catch (e: any) {
          console.error("Failed to save snapshot via IPC:", e);
        }
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDisplayMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Countdown Overlay */}
      {countdown !== null && document.getElementById('main-preview-area') && createPortal(
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[9999]">
          <div className="w-[120px] h-[120px] rounded-full border-[5px] border-[#e2e8f0] flex items-center justify-center animate-pulse">
            <span className="text-[72px] font-bold text-[#e2e8f0] tracking-tighter leading-none select-none">
              {countdown}
            </span>
          </div>
        </div>,
        document.getElementById('main-preview-area')!
      )}

      <div className="w-full h-12 flex justify-between items-center px-4 relative bg-white">
        {/* Toast Message */}
        {toastMessage && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full text-xs shadow-lg animate-in fade-in slide-in-from-bottom-4 z-[9999]">
            {toastMessage}
          </div>
        )}

        {/* Left icons */}
        <div className="flex space-x-2 items-center text-slate-400">

          {/* Display Preview Menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors"
              title="Display Options"
              onClick={() => setShowDisplayMenu(!showDisplayMenu)}
            >
              <MoreVertical className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {showDisplayMenu && (
              <div className="absolute bottom-full left-0 mb-3 w-48 bg-[#2d333b] rounded shadow-lg text-sm text-slate-200 z-50">
                {/* Arrow */}
                <div className="absolute -bottom-2 left-3 w-4 h-4 bg-[#2d333b] transform rotate-45 shadow-sm"></div>

                <div className="px-4 py-2.5 text-xs font-semibold tracking-wider text-white border-b border-white/10 relative z-10">
                  DISPLAY PREVIEW
                </div>

                <div className="flex flex-col py-2 relative z-10">
                  <button className="flex items-center space-x-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left">
                    <div className="flex space-x-0.5 ml-0.5">
                      <div className="w-1.5 h-1.5 bg-[#00B4FF] rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-[#00B4FF] rounded-sm"></div>
                    </div>
                    <span className="text-white">1 Row</span>
                  </button>
                  <button className="flex items-center space-x-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-slate-300">
                    <Grid2X2 className="w-4 h-4 text-slate-400" />
                    <span>2 Rows</span>
                  </button>
                  <button className="flex items-center space-x-3 px-4 py-2 hover:bg-white/10 transition-colors w-full text-left text-slate-300">
                    <MonitorOff className="w-4 h-4 text-slate-400" />
                    <span>Hide preview</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors" title="Scene List">
            <ListVideo className="w-5 h-5" strokeWidth={2} />
          </button>
          <button onClick={onOpenSettings} className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors" title="Settings">
            <Settings className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Center Action Cluster */}
        <div className="flex items-center justify-center space-x-4 flex-1">

          {/* Record Video Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-50 text-red-500' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <Video className="w-[25px] h-[25px] fill-current" strokeWidth={2} />
          </button>

          {/* Massive Broadcast Button */}
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform ${isStreaming ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[#1bc1ff] hover:bg-[#00a9eb] hover:scale-105'}`}
            title={isStreaming ? "Stop Streaming" : "Start Streaming"}
          >
            <Radio className="w-7 h-7" strokeWidth={2.5} />
          </button>

          {/* Take Snapshot / Camera */}
          <button
            onClick={handleTakeSnapshot}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:scale-95"
            title="Snapshot"
          >
            <Camera className="w-[25px] h-[25px]" strokeWidth={3.5} />
          </button>

        </div>

        {/* Right icons */}
        <div className="flex space-x-2 text-slate-400">
          <button className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors" title="Mute Audio">
            <MicOff className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => {
              if (window.electronAPI?.toggleFullscreen) {
                window.electronAPI.toggleFullscreen();
              }
            }}
            className="p-1 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors cursor-pointer" 
            title="Toggle Fullscreen"
          >
            <Maximize className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

      </div>
    </>
  );
};
