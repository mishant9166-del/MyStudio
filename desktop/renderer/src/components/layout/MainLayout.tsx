import React from 'react';
import { Volume2, Clock, Wand2, Image as ImageIcon, Images, Maximize, ChevronRightCircle, Info } from 'lucide-react';

export const MainLayout: React.FC<{
  header: React.ReactNode;
  preview: React.ReactNode;
  controls: React.ReactNode;
  scenes: React.ReactNode;
  rightPanel: React.ReactNode; // Sources & Properties flyout
  activeSidebarTab: 'presets' | 'effects' | 'time' | 'background' | 'sources' | 'audio' | 'settings' | 'streaming' | 'vcam' | 'lowerthirds' | 'magic' | 'gallery' | 'arrangement' | null;
  onTabChange: (tab: 'presets' | 'effects' | 'time' | 'background' | 'sources' | 'audio' | 'settings' | 'streaming' | 'vcam' | 'lowerthirds' | 'magic' | 'gallery' | 'arrangement' | null) => void;
}> = ({ header, preview, controls, scenes, rightPanel, activeSidebarTab, onTabChange }) => {

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-100">

      {/* Top Header */}
      <header
        className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-0 shrink-0 shadow-sm z-50 relative"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {header}
      </header>

      {/* Middle & Right Section */}
      <div className="flex flex-1 overflow-hidden">

        {/* Center Canvas Area (Preview + Controls + Scenes) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100">

          {/* Main Preview */}
          <main id="main-preview-area" className="flex-1 bg-[#F8FAFC] flex flex-col min-h-0 min-w-0 relative overflow-hidden">
            {preview}
          </main>

          {/* Bottom Action Controls */}
          <div className="shrink-0 z-10">
            {controls}
          </div>

          {/* Bottom Scenes Carousel */}
          <div className="shrink-0 w-full overflow-hidden">
            {scenes}
          </div>

        </div>

        {/* Right Sidebar Flyout */}
        <aside className={`${activeSidebarTab !== null ? 'w-[240px] border-l' : 'w-0 border-none overflow-hidden'} bg-white border-slate-200 shadow-xl z-20 flex flex-col shrink-0 transition-all duration-300`}>
          {rightPanel}
        </aside>

        {/* Rightmost Thin Icon Strip */}
        <div className="w-11 bg-[#f8fafc] border-l border-slate-200 flex flex-col items-center shrink-0 z-30 shadow-sm justify-between">
          <div className="flex flex-col w-full items-center">
            {/* 1. Sidebar with Image */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'presets' ? null : 'presets')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'presets' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Presets"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4h4v16H4z M10 4h10v16H10z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l2-2 4 4" />
                <circle cx="17" cy="9" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {/* 2. Volume */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'audio' ? null : 'audio')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'audio' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Audio"
            >
              <Volume2 className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* 3. Squiggle */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'effects' ? null : 'effects')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'effects' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Effects"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 12c3-6 5-6 8 0 3 6 5 6 8 0" />
              </svg>
            </button>

            {/* 4. Clock */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'time' ? null : 'time')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'time' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Time"
            >
              <Clock className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* 5. Monitor Grid */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'background' ? null : 'background')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'background' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Virtual Background"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2.5} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2 10h20 M8 10v10 M16 10v10" />
              </svg>
            </button>

            {/* 6. Monitor Person */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'lowerthirds' ? null : 'lowerthirds')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'lowerthirds' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Lower Thirds"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2.5} />
                <circle cx="12" cy="11" r="2.5" strokeWidth={2.5} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18c0-3.5 3-5 6-5s6 1.5 6 5" />
              </svg>
            </button>

            {/* 7. Magic Wand */}
            <button
              onClick={() => onTabChange(activeSidebarTab === 'magic' ? null : 'magic')}
              className={`w-full aspect-square flex items-center justify-center transition-colors ${activeSidebarTab === 'magic' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
              title="Magic Effects"
            >
              <Wand2 className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* 8. Image with Dot */}
            <div className="group relative w-full aspect-square flex items-center justify-center">
              <button 
                onClick={() => onTabChange(activeSidebarTab === 'gallery' ? null : 'gallery')}
                className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center relative transition-colors ${activeSidebarTab === 'gallery' ? 'bg-[#00B4FF] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`} 
              >
                <Images className="w-[18px] h-[18px]" strokeWidth={2.2} />
                {activeSidebarTab !== 'gallery' && (
                  <div className="absolute top-[6px] right-[6px] w-[8px] h-[8px] bg-[#F57B00] rounded-full border-[2px] border-white"></div>
                )}
              </button>
              {/* Tooltip */}
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-[#333C44] text-white text-[11px] font-medium px-2 py-1 rounded-[4px] whitespace-nowrap shadow-sm tracking-wide">
                  Gallery
                </div>
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[5px] border-l-[#333C44]"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full items-center mt-8 pb-2">
            {/* Info */}
            <button className="w-full aspect-square flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <Info className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
