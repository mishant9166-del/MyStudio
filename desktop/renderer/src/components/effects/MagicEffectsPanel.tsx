import React from 'react';
import { PanelContainer } from '../ui/PanelComponents';
import { Wand2, Heart, Search, FolderPlus, Plus, Download, Folder, Settings2 } from 'lucide-react';

export const MagicEffectsPanel = () => {
  const folders = [
    'Unordered', 'GIFS', 'Animals', 'Borders', 'Distortions', 
    'School', 'Emojis', 'Face Accessories', 'Face Masks', 
    'Filters', 'Foods & Beverages', 'Groups', 'Lower Thirds', 
    'Objects', 'Overlays', 'Sports'
  ];

  return (
    <PanelContainer>
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-slate-100">
        <button className="flex-1 h-12 flex items-center justify-center bg-[#00B4FF] text-white">
          <Wand2 className="w-5 h-5" />
        </button>
        <button className="flex-1 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <Heart className="w-5 h-5" />
        </button>
        <button className="flex-1 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        <button className="flex-1 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Dotted separator effect */}
      <div className="relative h-4 w-full">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 border-t-[1.5px] border-dotted border-slate-200"></div>
      </div>

      {/* EFFECTS Section */}
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">EFFECTS</h2>
        <div className="flex items-center space-x-3 text-slate-400">
          <button className="hover:text-slate-600 transition-colors">
            <FolderPlus className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folder List */}
      <div className="flex flex-col text-[13px] text-slate-500 overflow-y-auto max-h-[360px] scrollbar-thin">
        {folders.map(folder => (
          <div key={folder} className="flex items-center px-4 py-1.5 hover:bg-slate-50 cursor-pointer">
            <Folder className="w-4 h-4 mr-3 text-slate-400 fill-slate-300/30" />
            <span>{folder}</span>
          </div>
        ))}
      </div>

      {/* SELECTED EFFECTS Section */}
      <div className="border-t border-slate-100 mt-2 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 border-t-[1.5px] border-dotted border-slate-200"></div>
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">SELECTED EFFECTS</h2>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center px-4 py-2">
          <span className="text-lg mr-2 leading-none">⚽</span>
          <span className="text-[13px] text-slate-600">Sports/Soccer</span>
        </div>
      </div>
      
      <div className="h-8"></div>
    </PanelContainer>
  );
};
