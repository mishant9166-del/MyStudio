import React, { useState } from 'react';
import { PanelContainer, PanelSection, PanelDropdown } from '../ui/PanelComponents';
import { Play, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';

export const TimePanel = () => {
  const [clock, setClock] = useState(false);
  const [stopwatch, setStopwatch] = useState(false);
  const [timer, setTimer] = useState(false);
  const [seconds, setSeconds] = useState(true);

  return (
    <PanelContainer>
      <PanelSection title="Clock" toggle={clock} onToggle={setClock}>
        <div className="flex flex-col space-y-3 mt-2">
          <div className="flex space-x-2">
            <div className="flex-[3]"><PanelDropdown value="Do not show" options={['Do not show']} /></div>
            <div className="flex-[2]"><PanelDropdown value="12 hr" options={['12 hr', '24 hr']} /></div>
          </div>
          
          <div className="flex items-center justify-between">
            <input type="range" className="w-24 h-1.5 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" defaultValue={30} />
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-500">Seconds</span>
              <button onClick={() => setSeconds(!seconds)} className={`w-8 h-4 rounded-full relative transition-colors ${seconds ? 'bg-[#00B4FF]' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${seconds ? 'left-4.5' : 'left-0.5'}`} style={{ transform: seconds ? 'translateX(16px)' : 'translateX(0)' }}></div>
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <div className="flex-[3] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="flex-1 flex items-center pl-2 font-mono tracking-widest text-[14px]">12:43</div>
              <div className="w-6 flex items-center justify-center border-l border-slate-200"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-[2] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="flex-1 flex items-center justify-center"><div className="w-4 h-4 bg-[#666666] rounded-sm"></div></div>
              <div className="w-6 flex items-center justify-center border-l border-slate-200"><ChevronDown className="w-3 h-3" /></div>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Stopwatch" toggle={stopwatch} onToggle={setStopwatch}>
        <div className="flex flex-col space-y-3 mt-2">
          <div className="flex space-x-2">
            <div className="flex-[3] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="w-8 flex items-center justify-center text-slate-400"><ArrowUp className="w-4 h-4" /></div>
              <input type="text" className="flex-1 w-full h-full focus:outline-none text-[13px]" defaultValue="00:00:00" />
            </div>
            <button className="flex-[1] h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded hover:bg-slate-50"><Play className="w-4 h-4 fill-current" /></button>
            <button className="flex-[1] h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded hover:bg-slate-50"><RotateCcw className="w-4 h-4" /></button>
          </div>
          
          <input type="range" className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" defaultValue={30} />

          <div className="flex space-x-2">
            <div className="flex-[3] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="flex-1 flex items-center pl-2 font-mono tracking-widest text-[14px] bg-slate-400 text-white font-bold">12:43</div>
              <div className="w-6 flex items-center justify-center border-l border-slate-200"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-[2] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="flex-1 flex items-center justify-center"><div className="w-4 h-4 bg-[#666666] rounded-sm"></div></div>
              <div className="w-6 flex items-center justify-center border-l border-slate-200"><ChevronDown className="w-3 h-3" /></div>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Timer" toggle={timer} onToggle={setTimer}>
        <div className="flex flex-col space-y-3 mt-2">
          <div className="flex space-x-2">
            <div className="flex-[3] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="w-8 flex items-center justify-center text-slate-400"><ArrowDown className="w-4 h-4" /></div>
              <input type="text" className="flex-1 w-full h-full focus:outline-none text-[13px]" defaultValue="05:00:00" />
            </div>
            <button className="flex-[1] h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded hover:bg-slate-50"><Play className="w-4 h-4 fill-current" /></button>
            <button className="flex-[1] h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded hover:bg-slate-50"><RotateCcw className="w-4 h-4" /></button>
          </div>
          
          <input type="range" className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" defaultValue={30} />

          <div className="flex space-x-2">
            <div className="flex-[3] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="flex-1 flex items-center pl-2 font-mono tracking-widest text-[14px] bg-[#ef4444] text-white font-bold">12:43</div>
              <div className="w-6 flex items-center justify-center border-l border-slate-200"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-[2] flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 bg-white">
              <div className="flex-1 flex items-center justify-center"><div className="w-4 h-4 bg-[#ef4444] rounded-sm"></div></div>
              <div className="w-6 flex items-center justify-center border-l border-slate-200"><ChevronDown className="w-3 h-3" /></div>
            </div>
          </div>
        </div>
      </PanelSection>
      
      <div className="h-8"></div>
    </PanelContainer>
  );
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
