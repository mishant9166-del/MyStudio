import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { LowerThirdSource } from '../../../../../shared/types';
import { useScenes } from '../../context/SceneContext';
import { LOWER_THIRD_THEMES, renderThemePreview } from './LowerThirdTemplates';

interface LowerThirdEditorProps {
  sourceId: string;
  isNew?: boolean;
  onClose: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export const LowerThirdEditor: React.FC<LowerThirdEditorProps> = ({ sourceId, isNew, onClose, onSave, onCancel }) => {
  const { activeScene, dispatch } = useScenes();
  const [activeTab, setActiveTab] = useState<'general' | 'text' | 'design' | 'animation' | 'position' | 'timing' | 'logo' | 'advanced'>('general');

  if (!activeScene) return null;
  const lt = activeScene.sources.find(s => s.id === sourceId) as LowerThirdSource | undefined;
  if (!lt) return null;

  const updateSource = (updates: Partial<LowerThirdSource>) => {
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId, updates } });
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'text', label: 'Text' },
    { id: 'design', label: 'Design' },
    { id: 'animation', label: 'Animation' },
    { id: 'position', label: 'Position & Size' },
    { id: 'timing', label: 'Timing' },
    { id: 'logo', label: 'Logo & Icon' },
    { id: 'advanced', label: 'Advanced' }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-8 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">{isNew ? 'Create New Lower Third' : `Edit ${lt.name || 'Lower Third'}`}</h2>
          <div className="flex items-center space-x-3">
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 bg-slate-50 border-r border-slate-200 flex flex-col p-2 space-y-1 overflow-y-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-[#00B4FF] text-white' 
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              {/* Tabs Content */}
              <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-5 max-w-lg">
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[13px] font-semibold text-slate-700">Title</label>
                    <span className="text-[11px] text-slate-400 font-medium">{lt.title.length}/42</span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={42}
                    className="w-full border border-slate-200 rounded p-2 text-[13px] focus:outline-none focus:border-[#00B4FF] text-slate-700 bg-slate-50 focus:bg-white transition-colors" 
                    value={lt.title} 
                    onChange={(e) => updateSource({ title: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[13px] font-semibold text-slate-700">Subtitle</label>
                    <span className="text-[11px] text-slate-400 font-medium">{lt.subtitle.length}/52</span>
                  </div>
                  <textarea 
                    maxLength={52}
                    className="w-full border border-slate-200 rounded p-2 text-[13px] focus:outline-none focus:border-[#00B4FF] text-slate-700 bg-slate-50 focus:bg-white transition-colors h-16 resize-none" 
                    value={lt.subtitle}
                    onChange={(e) => updateSource({ subtitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4">Template</label>
                  <div className="grid grid-cols-2 gap-4">
                    {LOWER_THIRD_THEMES.map(theme => (
                      <div 
                        key={theme.id}
                        className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${lt.theme === theme.id ? 'border-[#00B4FF] bg-[#00B4FF]/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
                        onClick={() => updateSource({ theme: theme.id })}
                      >
                        {renderThemePreview(theme.id)}
                        <div className="p-2 text-center text-xs font-semibold text-slate-700 bg-white">
                          {theme.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'design' && (
              <div className="space-y-6 max-w-lg">
                <p className="text-slate-500 text-sm">More design properties will be implemented here (Colors, Gradients, Opacity).</p>
              </div>
            )}

            {activeTab === 'animation' && (
              <div className="space-y-6 max-w-lg">
                <p className="text-slate-500 text-sm">Animation properties (Entrance, Exit, Duration).</p>
              </div>
            )}

            {activeTab === 'position' && (
              <div className="space-y-6 max-w-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">X Position (px)</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-[#00B4FF] focus:ring-2 focus:ring-[#00B4FF]/20" 
                      value={lt.transform.x} 
                      onChange={(e) => updateSource({ transform: { ...lt.transform, x: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Y Position (px)</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-[#00B4FF] focus:ring-2 focus:ring-[#00B4FF]/20" 
                      value={lt.transform.y} 
                      onChange={(e) => updateSource({ transform: { ...lt.transform, y: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Width (px)</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-[#00B4FF] focus:ring-2 focus:ring-[#00B4FF]/20" 
                      value={lt.transform.width} 
                      onChange={(e) => updateSource({ transform: { ...lt.transform, width: Number(e.target.value) } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Height (px)</label>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-[#00B4FF] focus:ring-2 focus:ring-[#00B4FF]/20" 
                      value={lt.transform.height} 
                      onChange={(e) => updateSource({ transform: { ...lt.transform, height: Number(e.target.value) } })}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'timing' && (
              <div className="space-y-6 max-w-lg">
                <p className="text-slate-500 text-sm">Timing properties (Display Mode, Auto-Hide Duration).</p>
              </div>
            )}
          </div>

          {/* Right Column (Live Preview placeholder) */}
          <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col items-center">
             <div className="text-sm font-semibold text-slate-500 mb-4 w-full">Preview</div>
             <div className="w-full aspect-video bg-checkerboard rounded-lg border border-slate-200 flex items-end justify-center pb-8 overflow-hidden relative"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}>
                
                {/* Simple mock preview of the lower third */}
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                     <canvas ref={(canvas) => {
                       if (!canvas) return;
                       const ctx = canvas.getContext('2d');
                       if (!ctx) return;
                       ctx.clearRect(0, 0, canvas.width, canvas.height);
                       const previewRatio = canvas.width / canvas.height;
                       const ltRatio = lt.transform.width / lt.transform.height;
                       
                       let drawW = canvas.width;
                       let drawH = canvas.height;
                       let drawX = 0;
                       let drawY = 0;
                       
                       if (ltRatio > previewRatio) {
                         drawW = canvas.width;
                         drawH = canvas.width / ltRatio;
                         drawY = (canvas.height - drawH) / 2;
                       } else {
                         drawH = canvas.height;
                         drawW = canvas.height * ltRatio;
                         drawX = (canvas.width - drawW) / 2;
                       }

                       import('./LowerThirdRenderer').then(({ drawLowerThird }) => {
                         drawLowerThird(ctx, lt, drawX, drawY, drawW, drawH);
                       });
                     }} width={800} height={450} className="w-full max-h-full object-contain drop-shadow-xl" />
                  </div>

             </div>
             
             {/* Save Button */}
             <div className="mt-auto w-full pt-6 flex justify-end">
               <button type="button" onClick={onSave || onClose} className="px-6 py-2 bg-[#00B4FF] text-white font-medium text-sm rounded hover:bg-[#009ce0] transition-colors shadow-sm">
                 Save
               </button>
             </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};












