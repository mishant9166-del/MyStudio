import React from 'react';
import { PanelContainer } from '../ui/PanelComponents';
import { Plus, LayoutGrid, Image as ImageIcon, SlidersHorizontal, MapPin } from 'lucide-react';

export const PresetsPanel = () => {
  return (
    <PanelContainer>
      {/* PRESETS SECTION */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PRESETS</h2>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-col text-[13px] text-slate-600">
        {/* Preset 1 (Active) */}
        <div className="flex flex-col">
          <div className="flex items-center px-4 py-2 bg-[#f0f9ff] relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00B4FF]"></div>
            <LayoutGrid className="w-4 h-4 mr-2 text-[#00B4FF]" />
            <span className="text-slate-700">Preset 1</span>
          </div>
          
          {/* Children of Preset 1 */}
          <div className="flex flex-col bg-[#f8fafc] py-1 border-b border-slate-100">
            <div className="flex items-center pl-10 pr-4 py-1.5 hover:bg-slate-100 cursor-pointer text-slate-500">
              <div className="w-3.5 h-3.5 mr-2 border border-slate-300 rounded-sm flex items-center justify-center text-slate-400">
                <Plus className="w-2.5 h-2.5" strokeWidth={3} />
              </div>
              <span>Add new layer</span>
            </div>
            
            <div className="flex items-center pl-10 pr-4 py-1.5 hover:bg-slate-100 cursor-pointer text-slate-500">
              <MapPin className="w-3.5 h-3.5 mr-2 text-[#00B4FF]" strokeWidth={2.5} />
              <span>OBS Virtual Cam...</span>
            </div>
          </div>
        </div>

        {/* Preset 2 */}
        <div className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
          <LayoutGrid className="w-4 h-4 mr-2 text-slate-400" />
          <span>Preset 2</span>
        </div>
      </div>

      <div className="h-48"></div> {/* Spacer for screenshot effect */}

      {/* VIDEO SOURCES SECTION */}
      <div className="flex items-center justify-between px-4 py-3 border-y border-slate-100 mt-4">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VIDEO SOURCES</h2>
        <div className="flex items-center space-x-3 text-slate-400">
          <button className="hover:text-slate-600 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col text-[13px] text-slate-600">
        <div className="flex items-center px-4 py-2 bg-[#f0f9ff] relative border-b border-slate-100">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00B4FF]"></div>
          <MapPin className="w-3.5 h-3.5 mr-2 text-[#00B4FF]" strokeWidth={2.5} />
          <span className="text-slate-700">OBS Virtual Camera</span>
        </div>
      </div>
    </PanelContainer>
  );
};
