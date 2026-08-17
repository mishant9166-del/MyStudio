import React, { useState } from 'react';
import { PanelContainer, PanelSection } from '../ui/PanelComponents';
import { X, ChevronDown } from 'lucide-react';

export const LowerThirdsPanel = () => {
  const [lowerThird1, setLowerThird1] = useState(false);

  return (
    <PanelContainer>
      <PanelSection title="Lower Thirds" headerRight={<div className="w-3 h-3 grid grid-cols-2 gap-[1px] opacity-30"><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div><div className="bg-current rounded-sm"></div></div>}>
        <div className="border border-slate-200 rounded-md mt-2 bg-white">
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            <span className="font-semibold text-slate-500">Lower Third 1</span>
            <div className="flex items-center space-x-2">
              <button onClick={() => setLowerThird1(!lowerThird1)} className={`w-8 h-4 rounded-full relative transition-colors ${lowerThird1 ? 'bg-[#00B4FF]' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${lowerThird1 ? 'left-4.5' : 'left-0.5'}`} style={{ transform: lowerThird1 ? 'translateX(16px)' : 'translateX(0)' }}></div>
              </button>
              <button className="text-white bg-red-400 hover:bg-red-500 rounded-full p-0.5">
                <X className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>
          </div>
          
          <div className="p-3 flex flex-col space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[12px] font-semibold text-slate-500">Title</label>
                <span className="text-[11px] text-slate-400">8/42</span>
              </div>
              <input type="text" className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#00B4FF] text-slate-600" defaultValue="MR Vikas" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[12px] font-semibold text-slate-500">Subtitle</label>
                <span className="text-[11px] text-slate-400">28/52</span>
              </div>
              <textarea className="w-full border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#00B4FF] text-slate-600 h-16 resize-none" defaultValue="Expert in nDesign and Studio"></textarea>
            </div>

            <div className="w-full h-10 bg-slate-800 rounded relative flex items-center justify-between overflow-hidden cursor-pointer">
              {/* Fake gradient lower third preview */}
              <div className="w-2/3 h-full relative pl-2 pt-1">
                <div className="w-full h-4 bg-gradient-to-r from-cyan-300 to-cyan-500 -skew-x-12 transform origin-bottom-left shadow-sm"></div>
                <div className="w-5/6 h-3 bg-gradient-to-r from-white to-slate-300 -skew-x-12 transform origin-bottom-left shadow-sm mt-0.5 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
              </div>
              <div className="w-6 h-full flex items-center justify-center text-white/70 hover:text-white border-l border-white/10 z-10">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-3 py-2 bg-[#00B4FF] hover:bg-[#009ce0] text-white rounded font-medium transition-colors">
          Add a new Lower Third
        </button>
      </PanelSection>
      <div className="h-8"></div>
    </PanelContainer>
  );
};
