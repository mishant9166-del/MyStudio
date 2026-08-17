import React, { useState } from 'react';
import { PanelContainer, PanelSection } from '../ui/PanelComponents';

export const ArrangementPanel = () => {
  const [presetAudio, setPresetAudio] = useState(true);

  return (
    <PanelContainer>
      <PanelSection 
        title="Preset Audio" 
        toggle={presetAudio} 
        onToggle={setPresetAudio} 
        headerRight={
          <div className="text-orange-400 w-3 h-3 grid grid-cols-2 gap-[1px]">
            <div className="bg-current rounded-sm"></div>
            <div className="bg-current rounded-sm"></div>
            <div className="bg-current rounded-sm"></div>
            <div className="bg-current rounded-sm"></div>
          </div>
        } 
      />
    </PanelContainer>
  );
};
