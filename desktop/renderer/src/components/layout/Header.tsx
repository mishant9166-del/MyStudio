import { useState, useRef, useEffect } from 'react';
import { Crop, ZoomIn, Sun, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, RefreshCw, ChevronDown, Plus, Minus } from 'lucide-react';

export function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 250);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If clicking outside any dropdown, close it
      // But we'll handle this purely with hover logic here as requested!
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Dropdown Container Component
  const Dropdown = ({ id, title, children, width = 'w-64', align = 'right' }: { id: string, title?: string, children: React.ReactNode, width?: string, align?: 'left' | 'right' | 'center' }) => {
    if (activeDropdown !== id) return null;
    
    let alignClass = 'right-0';
    if (align === 'left') alignClass = 'left-0';
    else if (align === 'center') alignClass = 'left-1/2 -translate-x-1/2';

    return (
      <div 
        className={`absolute top-full ${alignClass} ${width} z-50`}
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <div className="bg-[#2c3439] text-white rounded shadow-xl border border-slate-700 relative">
          {/* Top little triangle pointer */}
          <div className={`absolute -top-1.5 ${align === 'left' ? 'left-4' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-4'} w-3 h-3 bg-[#2c3439] border-t border-l border-slate-700 transform rotate-45`}></div>
          
          {title && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50 bg-[#2c3439] relative z-10 rounded-t">
              <span className="text-[11px] font-bold tracking-wider text-slate-300">{title}</span>
              <button className="text-slate-400 hover:text-white transition-colors">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="p-3 relative z-10">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center h-full relative">
        <div 
          className="relative h-full flex items-center"
          onMouseEnter={() => handleMouseEnter('main-menu')}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className={`px-4 h-full flex items-center justify-center transition-colors ${activeDropdown === 'main-menu' ? 'bg-slate-50 text-slate-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          
          {/* Main Menu Dropdown */}
          <Dropdown id="main-menu" width="w-48" align="left">
            <div className="flex flex-col space-y-0.5 text-sm">
              <button className="w-full text-left px-3 py-2 hover:bg-[#404b53] rounded transition-colors text-slate-200">Save Project</button>
              <button className="w-full text-left px-3 py-2 hover:bg-[#404b53] rounded transition-colors text-slate-200">Open Project</button>
              <button className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#404b53] rounded transition-colors text-slate-200">
                <span>Show Guests</span>
                <span className="bg-[#ff8c00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">NEW</span>
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-[#404b53] rounded transition-colors text-slate-200">Exit MYSTUDIO</button>
            </div>
          </Dropdown>
        </div>
        
        <div className="flex items-center pl-0 pr-4">
          <span className="text-[16px] font-bold text-slate-600 tracking-tight flex items-center">
             MYSTUDIO
          </span>
        </div>
      </div>

      <div className="flex items-center h-full text-[13px] text-slate-500 font-medium relative">
        {/* Right side Icons */}
        <div className="flex items-center space-x-2 px-3 border-r border-slate-200 h-full text-slate-400">
          
          {/* Transform Icon */}
          <div 
            className="relative h-full flex items-center px-2"
            onMouseEnter={() => handleMouseEnter('transform')}
            onMouseLeave={handleMouseLeave}
          >
            <button style={{ WebkitAppRegion: 'no-drag' } as any} className={`hover:text-slate-600 transition-colors ${activeDropdown === 'transform' ? 'text-slate-600' : ''}`} title="Transform">
              <Crop className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <Dropdown id="transform" title="TRANSFORM" width="w-56">
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between bg-[#404b53] hover:bg-[#4b5760] transition-colors rounded px-2.5 py-1.5 text-xs text-slate-200">
                  <span>Fit (default)</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <div className="flex items-center space-x-1">
                  <button className="flex-1 bg-[#404b53] hover:bg-[#4b5760] rounded py-1.5 flex justify-center text-slate-300"><RotateCcw className="w-3.5 h-3.5" /></button>
                  <button className="flex-1 bg-[#404b53] hover:bg-[#4b5760] rounded py-1.5 flex justify-center text-slate-300"><RotateCw className="w-3.5 h-3.5" /></button>
                  <button className="flex-1 bg-[#404b53] hover:bg-[#4b5760] rounded py-1.5 flex justify-center text-slate-300"><FlipHorizontal className="w-3.5 h-3.5" /></button>
                  <button className="flex-1 bg-[#404b53] hover:bg-[#4b5760] rounded py-1.5 flex justify-center text-slate-300"><FlipVertical className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Corner Radius</span>
                    <span className="bg-[#404b53] px-1.5 rounded">0%</span>
                  </div>
                  <input type="range" className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" defaultValue={0} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>Opacity</span>
                    <span className="bg-[#404b53] px-1.5 rounded">100%</span>
                  </div>
                  <input type="range" className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" defaultValue={100} />
                </div>
              </div>
            </Dropdown>
          </div>

          {/* Zoom Icon */}
          <div 
            className="relative h-full flex items-center px-2"
            onMouseEnter={() => handleMouseEnter('zoom')}
            onMouseLeave={handleMouseLeave}
          >
            <button style={{ WebkitAppRegion: 'no-drag' } as any} className={`hover:text-slate-600 transition-colors ${activeDropdown === 'zoom' ? 'text-slate-600' : ''}`} title="Zoom">
              <ZoomIn className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <Dropdown id="zoom" title="ZOOM" width="w-48">
              <div className="flex items-center space-x-2 bg-[#404b53] rounded p-1">
                <button className="p-1 hover:bg-[#4b5760] rounded text-slate-300"><Minus className="w-3 h-3" /></button>
                <input type="range" className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]" defaultValue={50} />
                <button className="p-1 hover:bg-[#4b5760] rounded text-slate-300"><Plus className="w-3 h-3" /></button>
              </div>
            </Dropdown>
          </div>

          {/* Color Adjustment Icon */}
          <div 
            className="relative h-full flex items-center px-2"
            onMouseEnter={() => handleMouseEnter('color')}
            onMouseLeave={handleMouseLeave}
          >
            <button style={{ WebkitAppRegion: 'no-drag' } as any} className={`hover:text-slate-600 transition-colors ${activeDropdown === 'color' ? 'text-slate-600' : ''}`} title="Color Adjustment">
              <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <Dropdown id="color" title="COLOR ADJUSTMENT" width="w-56">
              <div className="space-y-3">
                {[
                  { icon: <Sun className="w-3 h-3 text-slate-300" />, val: 0 },
                  { icon: <div className="w-3 h-3 rounded-full bg-gradient-to-r from-white to-black border border-slate-500"></div>, val: 0 },
                  { icon: <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>, val: 0 },
                  { icon: <div className="w-3 h-3 rounded-full bg-red-500"></div>, val: 0 },
                  { icon: <div className="w-3 h-3 rounded-full bg-green-500"></div>, val: 0 },
                  { icon: <div className="w-3 h-3 rounded-full bg-blue-500"></div>, val: 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-4 flex justify-center">{item.icon}</div>
                    <input type="range" className="flex-1 h-0.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-slate-300" defaultValue={50} />
                    <span className="text-[10px] text-slate-300 w-4 text-right">{item.val}</span>
                  </div>
                ))}
              </div>
            </Dropdown>
          </div>

        </div>
        
        {/* FPS Dropdown */}
        <div 
          className="relative h-full flex items-center px-3 border-r border-slate-200"
          onMouseEnter={() => handleMouseEnter('fps')}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center cursor-pointer hover:bg-slate-50 h-full px-2">
            <span className="font-bold text-slate-500 text-xs">30 <span className="font-normal text-slate-400">fps</span></span>
          </div>
          {activeDropdown === 'fps' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-16 z-50" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <div className="bg-[#2c3439] text-white rounded shadow-xl border border-slate-700 py-1 relative text-center text-xs">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2c3439] border-t border-l border-slate-700 transform rotate-45"></div>
                <div className="relative z-10">
                  {[5, 10, 15, 20, 25, 30, 60].map(fps => (
                    <div key={fps} className="py-1.5 hover:bg-[#404b53] cursor-pointer text-slate-300 hover:text-white transition-colors">{fps}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resolution Dropdown */}
        <div 
          className="relative h-full flex items-center px-3 border-r border-slate-200"
          onMouseEnter={() => handleMouseEnter('res')}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center cursor-pointer hover:bg-slate-50 h-full px-2">
            <span className="font-bold text-slate-500 text-xs">720<span className="font-normal text-slate-400">p</span></span>
          </div>
          {activeDropdown === 'res' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-24 z-50" style={{ WebkitAppRegion: 'no-drag' } as any}>
              <div className="bg-[#2c3439] text-white rounded shadow-xl border border-slate-700 py-1 relative text-center text-xs">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2c3439] border-t border-l border-slate-700 transform rotate-45"></div>
                <div className="relative z-10">
                  {['240p', '360p', '480p', '720p', 'Customize...'].map(res => (
                    <div key={res} className="py-1.5 hover:bg-[#404b53] cursor-pointer text-slate-300 hover:text-white transition-colors">{res}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center px-5 h-full mr-[140px]">
          <div className="relative mr-2.5">
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
            <div className="absolute top-0 right-0 w-[9px] h-[9px] bg-[#10b981] border-[1.5px] border-white rounded-full translate-x-0.5 -translate-y-0.5"></div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 tracking-[0.02em]">E TECHRISE INFRAS</span>
        </div>
      </div>
    </>
  );
}
