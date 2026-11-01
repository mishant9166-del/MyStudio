import type { ReactNode } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

export const PanelContainer = ({ children, title, onAdd }: { children: ReactNode, title?: string, onAdd?: () => void }) => (
  <div className="flex flex-col h-full bg-white font-sans text-[13px] text-slate-600">
    {title && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-[#f8fafc]">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h2>
        {onAdd && (
          <button onClick={onAdd} className="text-slate-400 hover:text-slate-600 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {children}
    </div>
  </div>
);

export const PanelSection = ({ children, title, toggle, onToggle, headerRight }: { children?: ReactNode, title: string, toggle?: boolean, onToggle?: (val: boolean) => void, headerRight?: ReactNode }) => (
  <div className="border-b border-slate-100 last:border-b-0 relative">
    {/* Dotted top border effect from screenshot */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 border-t-[1.5px] border-dotted border-slate-200"></div>
    
    <div className="flex items-center justify-between px-4 py-3">
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <div className="flex items-center space-x-2">
        {headerRight}
        {onToggle !== undefined && (
          <button 
            onClick={() => onToggle(!toggle)}
            className={`w-8 h-4 rounded-full relative transition-colors ${toggle ? 'bg-[#00B4FF]' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${toggle ? 'left-4.5' : 'left-0.5'}`} style={{ transform: toggle ? 'translateX(16px)' : 'translateX(0)' }}></div>
          </button>
        )}
      </div>
    </div>
    {children && <div className="px-4 pb-4">{children}</div>}
  </div>
);

export const PanelDropdown = ({ value, options, onChange }: { value: string, options: string[], onChange?: (val: string) => void }) => (
  <div className="relative w-full">
    <select 
      value={value} 
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full appearance-none bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-600 focus:outline-none focus:border-[#00B4FF] pr-8"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
);

export const PanelSlider = ({ value, min = 0, max = 100, onChange, rightLabel }: { value: number, min?: number, max?: number, onChange?: (val: number) => void, rightLabel?: string }) => (
  <div className="flex items-center space-x-3 w-full">
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange?.(Number(e.target.value))}
      className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none outline-none accent-[#00B4FF]"
    />
    {rightLabel && <span className="text-[11px] text-slate-500 w-8 text-right shrink-0">{rightLabel}</span>}
  </div>
);
