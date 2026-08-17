import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { v4 as uuidv4 } from 'uuid';

export const AudioSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, dispatch } = useAudio();
  
  const [selectedMic, setSelectedMic] = useState(state.inputDevices[0]?.id || '');
  const [selectedDesktop, setSelectedDesktop] = useState(state.outputDevices[0]?.id || '');
  const [selectedMonitor, setSelectedMonitor] = useState(state.monitorDeviceId || state.outputDevices[0]?.id || '');

  const handleAddMic = () => {
    if (!selectedMic) return;
    const device = state.inputDevices.find(d => d.id === selectedMic);
    dispatch({ 
      type: 'ADD_SOURCE', 
      payload: { sourceId: uuidv4(), deviceId: selectedMic, type: 'mic', name: device ? device.name : 'Mic/Aux' } 
    });
    onClose();
  };

  const handleAddDesktop = () => {
    if (!selectedDesktop) return;
    dispatch({ 
      type: 'ADD_SOURCE', 
      payload: { 
        sourceId: uuidv4(), 
        deviceId: selectedDesktop, 
        type: 'desktop', 
        name: state.outputDevices.find(d => d.id === selectedDesktop)?.name || 'Desktop Audio' 
      } 
    });
    onClose();
  };

  const handleSetMonitor = (deviceId: string) => {
    setSelectedMonitor(deviceId);
    dispatch({ type: 'SET_MONITOR_DEVICE', payload: { deviceId } });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center">
          <svg className="w-4 h-4 mr-2 text-[#00B4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          Audio Settings
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        
        {/* Add Microphone */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Microphone</h3>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 mb-3 text-sm focus:outline-none focus:border-[#00B4FF]"
            value={selectedMic}
            onChange={e => setSelectedMic(e.target.value)}
          >
            <option value="" disabled>Select a Microphone...</option>
            {state.inputDevices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button 
            onClick={handleAddMic}
            disabled={!selectedMic}
            className="w-full bg-[#00B4FF] hover:bg-cyan-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-2 rounded text-sm transition-colors shadow-sm"
          >
            Add Mic/Aux
          </button>
        </div>

        {/* Add Desktop Audio */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Desktop Audio</h3>
          <p className="text-xs text-slate-500 mb-2">Captures audio playing through a specific output device.</p>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 mb-3 text-sm focus:outline-none focus:border-[#00B4FF]"
            value={selectedDesktop}
            onChange={e => setSelectedDesktop(e.target.value)}
          >
            <option value="" disabled>Select an Output Device...</option>
            {state.outputDevices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button 
            onClick={handleAddDesktop}
            disabled={!selectedDesktop}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:text-slate-400 font-semibold py-2 rounded text-sm transition-colors shadow-sm"
          >
            Add Desktop Audio
          </button>
        </div>

        {/* Monitoring */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Monitoring Device</h3>
          <p className="text-xs text-slate-500 mb-2">Where should monitored audio be sent?</p>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded p-2 text-sm focus:outline-none focus:border-[#00B4FF]"
            value={selectedMonitor}
            onChange={e => handleSetMonitor(e.target.value)}
          >
            <option value="">(None)</option>
            {state.outputDevices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};
