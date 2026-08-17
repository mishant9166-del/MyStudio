import React from 'react';
import { PanelContainer } from '../ui/PanelComponents';
import { FileText, PlaySquare, Image as ImageIcon, Search, Plus, List, Grid } from 'lucide-react';

export const GalleryPanel = () => {
  return (
    <PanelContainer>
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-slate-100">
        <button className="flex-[1.5] h-12 flex items-center justify-center bg-[#00B4FF] text-white">
          <FileText className="w-5 h-5" />
        </button>
        <button className="flex-1 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <PlaySquare className="w-5 h-5" />
        </button>
        <button className="flex-1 h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <ImageIcon className="w-5 h-5" />
        </button>
        <button className="flex-[1.5] h-12 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* ALBUMS Section */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">ALBUMS</h2>
        <div className="flex items-center space-x-3 text-slate-400">
          <button className="hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <List className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button className="text-[#00B4FF]">
            <Grid className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Album Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-2">
        {/* Album 1 */}
        <div className="flex flex-col cursor-pointer group">
          <div className="w-full h-20 bg-slate-900 rounded border border-slate-200 relative overflow-hidden flex items-center justify-center">
            {/* Fake static noise background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            <ImageIcon className="w-6 h-6 text-white z-10" />
          </div>
          <span className="text-[12px] text-slate-600 mt-1">My snapshots</span>
        </div>

        {/* Album 2 */}
        <div className="flex flex-col cursor-pointer group relative">
          <div className="w-full h-20 bg-[#f0f9ff] rounded border border-slate-200 flex items-center justify-center">
            <PlaySquare className="w-6 h-6 text-white fill-white" strokeWidth={1} />
          </div>
          <span className="text-[12px] text-slate-600 mt-1 pl-1 relative">
            <div className="absolute -left-3 top-0 w-4 h-4 bg-[#ff7b00] rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
              1
            </div>
            My recordings
          </span>
        </div>
      </div>
      
      <div className="h-8"></div>
    </PanelContainer>
  );
};
