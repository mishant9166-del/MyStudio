import React, { useState } from 'react';
import { PanelContainer, PanelSection } from '../ui/PanelComponents';

export const BackgroundPanel = () => {
  const [background, setBackground] = useState(false);
  const [blurAmount, setBlurAmount] = useState(30);
  const [advanced, setAdvanced] = useState(false);
  const [mode, setMode] = useState('Blur');

  return (
    <PanelContainer>
      <PanelSection title="Virtual Background" toggle={background} onToggle={setBackground}>
        <div className="flex flex-col space-y-3 mt-4">
          
          {/* Radio Options */}
          <div className="flex flex-col space-y-3">
            {['Blur', 'Replace', 'Chroma Key'].map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mode === option ? 'border-[#00B4FF]' : 'border-slate-300'}`}>
                  {mode === option && <div className="w-2 h-2 rounded-full bg-[#00B4FF]"></div>}
                </div>
                <span className={mode === option ? 'text-[#00B4FF]' : 'text-slate-400'}>{option}</span>
              </label>
            ))}
          </div>

          <div className="pt-6">
            <span className="text-[12px] font-semibold text-slate-400 mb-2 block">Blur amount</span>
            <input 
              type="range" 
              className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-[#00B4FF]" 
              value={blurAmount}
              onChange={(e) => setBlurAmount(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between pt-6">
            <span className="text-[12px] font-semibold text-slate-400">Advanced Settings</span>
            <button onClick={() => setAdvanced(!advanced)} className={`w-8 h-4 rounded-full relative transition-colors ${advanced ? 'bg-[#00B4FF]' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${advanced ? 'left-4.5' : 'left-0.5'}`} style={{ transform: advanced ? 'translateX(16px)' : 'translateX(0)' }}></div>
            </button>
          </div>

        </div>
      </PanelSection>
    </PanelContainer>
  );
};
