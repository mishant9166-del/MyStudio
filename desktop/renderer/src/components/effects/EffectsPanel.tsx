import React, { useState } from 'react';
import { PanelContainer, PanelSection, PanelDropdown } from '../ui/PanelComponents';
import { MousePointer2, Square, Undo, Redo, Move, Save, Folder, Eraser, PaintBucket, PenTool, Stamp, Circle, AlignLeft, AlignCenter, AlignRight, Underline, Strikethrough } from 'lucide-react';

export const EffectsPanel = () => {
  const [blur, setBlur] = useState(false);
  const [draw, setDraw] = useState(true);
  const [text, setText] = useState(true);

  return (
    <PanelContainer>
      <PanelSection title="Blur" toggle={blur} onToggle={setBlur}>
        <div className="flex space-x-2 mt-2">
          <button className="w-8 h-8 flex items-center justify-center border border-[#00B4FF] bg-[#e6f7ff] text-[#00B4FF] rounded">
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
            <Square className="w-4 h-4 fill-current" />
          </button>
          <button className="px-4 h-8 flex items-center justify-center bg-[#f0f9ff] text-slate-600 rounded ml-auto text-[13px]">
            Cancel
          </button>
        </div>
      </PanelSection>

      <PanelSection title="Draw" toggle={draw} onToggle={setDraw} headerRight={<div className="flex space-x-2 mr-2 text-slate-400"><Undo className="w-4 h-4" /><Redo className="w-4 h-4" /></div>}>
        <div className="flex flex-col space-y-3 mt-2">
          <div className="flex space-x-2">
            <button className="w-8 h-8 flex items-center justify-center border border-[#00B4FF] bg-[#e6f7ff] text-[#00B4FF] rounded">
              <MousePointer2 className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
              <Move className="w-4 h-4" />
            </button>
            <div className="flex-1"></div>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
              <Save className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
              <Folder className="w-4 h-4" />
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
              <Eraser className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
              <PaintBucket className="w-4 h-4" />
            </button>
            <button className="flex-1 h-8 flex items-center justify-center bg-[#f0f9ff] text-slate-600 rounded text-[13px]">
              Cancel
            </button>
          </div>

          <div className="flex space-x-2 pt-1">
            <div className="flex-1 flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500">
              <div className="flex-1 flex items-center justify-center border-r border-slate-200"><PenTool className="w-4 h-4" /></div>
              <div className="w-5 flex items-center justify-center"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-1 flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500">
              <div className="flex-1 flex items-center justify-center border-r border-slate-200"><Stamp className="w-4 h-4" /></div>
              <div className="w-5 flex items-center justify-center"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-1 flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500">
              <div className="flex-1 flex items-center justify-center border-r border-slate-200"><Circle className="w-4 h-4" /></div>
              <div className="w-5 flex items-center justify-center"><ChevronDown className="w-3 h-3" /></div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <input type="range" className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" defaultValue={20} />
            <div className="w-16 flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500">
              <div className="flex-1 flex items-center justify-center border-r border-slate-200">
                <div className="w-4 h-4 bg-slate-200 grid grid-cols-2 gap-[1px]"><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div><div className="bg-white"></div></div>
              </div>
              <div className="w-5 flex items-center justify-center"><ChevronDown className="w-3 h-3" /></div>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Text" toggle={text} onToggle={setText}>
        <div className="flex flex-col space-y-2 mt-2">
          <PanelDropdown value="Roboto" options={['Roboto', 'Arial', 'Times New Roman']} />
          <div className="flex space-x-2">
            <div className="w-24"><PanelDropdown value="10" options={['10', '12', '14']} /></div>
            <div className="flex-1"><PanelDropdown value="Regular" options={['Regular', 'Bold', 'Italic']} /></div>
          </div>
          
          <div className="flex space-x-2 pt-1">
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded"><AlignLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded"><AlignCenter className="w-4 h-4" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#00B4FF] bg-[#e6f7ff] text-[#00B4FF] rounded"><AlignRight className="w-4 h-4" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded"><Underline className="w-4 h-4" /></button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded"><Strikethrough className="w-4 h-4" /></button>
          </div>

          <div className="flex space-x-2 pt-1">
            <div className="flex-1 flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 max-w-[80px]">
              <div className="flex-1 flex items-center justify-center border-r border-slate-200"><span className="font-serif font-bold text-lg leading-none border-b-2 border-black">A</span></div>
              <div className="w-5 flex items-center justify-center"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-1 flex border border-slate-200 rounded overflow-hidden h-8 text-slate-500 max-w-[60px]">
              <div className="flex-1 flex items-center justify-center border-r border-slate-200"><Square className="w-4 h-4 text-slate-200" /></div>
              <div className="w-5 flex items-center justify-center"><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="flex-1"></div>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded">
              <span className="font-serif text-sm">Tx</span> {/* Close enough icon */}
            </button>
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <div className="w-32"><PanelDropdown value="Left to right" options={['Left to right', 'Right to left']} /></div>
            <input type="range" className="flex-1 h-1 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" defaultValue={50} />
          </div>

          <textarea 
            className="w-full h-24 mt-2 p-2 border border-slate-200 rounded resize-none focus:outline-none focus:border-[#00B4FF] text-slate-600"
            defaultValue="eiyrieifyug"
          ></textarea>
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
