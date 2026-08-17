import { useState } from 'react';
import { useScenes } from '../../context/SceneContext';
import { FilterPanel } from '../properties/FilterPanel';

interface Props {
  selectedSourceId: string | null;
}

export const PropertiesPanel = ({ selectedSourceId }: Props) => {
  const { dispatch, activeScene } = useScenes();
  const [preserveAspect, setPreserveAspect] = useState(true);

  if (!activeScene || !selectedSourceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <span className="text-slate-400 text-sm font-medium bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          Select a layer to configure
        </span>
      </div>
    );
  }

  const source = activeScene.sources.find(s => s.id === selectedSourceId);
  if (!source) return null;

  const updateTransform = (key: keyof typeof source.transform, value: string) => {
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { transform: { ...source.transform, [key]: Number(value) } } } });
  };

  const updateCrop = (key: keyof typeof source.crop, value: string) => {
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { crop: { ...source.crop, [key]: Number(value) } } } });
  };

  const updateOpacity = (value: string) => {
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { opacity: Number(value) / 100 } } });
  };

  const LOGICAL_WIDTH = 1920;
  const LOGICAL_HEIGHT = 1080;

  const handleQuickPosition = (preset: string) => {
    let targetX = 0, targetY = 0, targetW = LOGICAL_WIDTH, targetH = LOGICAL_HEIGHT;

    switch (preset) {
      case 'full': targetX = 0; targetY = 0; targetW = LOGICAL_WIDTH; targetH = LOGICAL_HEIGHT; break;
      case 'top-half': targetX = 0; targetY = 0; targetW = LOGICAL_WIDTH; targetH = LOGICAL_HEIGHT / 2; break;
      case 'bottom-half': targetX = 0; targetY = LOGICAL_HEIGHT / 2; targetW = LOGICAL_WIDTH; targetH = LOGICAL_HEIGHT / 2; break;
      case 'left-half': targetX = 0; targetY = 0; targetW = LOGICAL_WIDTH / 2; targetH = LOGICAL_HEIGHT; break;
      case 'right-half': targetX = LOGICAL_WIDTH / 2; targetY = 0; targetW = LOGICAL_WIDTH / 2; targetH = LOGICAL_HEIGHT; break;
      case 'top-left': targetX = 0; targetY = 0; targetW = LOGICAL_WIDTH / 2; targetH = LOGICAL_HEIGHT / 2; break;
      case 'top-right': targetX = LOGICAL_WIDTH / 2; targetY = 0; targetW = LOGICAL_WIDTH / 2; targetH = LOGICAL_HEIGHT / 2; break;
      case 'bottom-left': targetX = 0; targetY = LOGICAL_HEIGHT / 2; targetW = LOGICAL_WIDTH / 2; targetH = LOGICAL_HEIGHT / 2; break;
      case 'bottom-right': targetX = LOGICAL_WIDTH / 2; targetY = LOGICAL_HEIGHT / 2; targetW = LOGICAL_WIDTH / 2; targetH = LOGICAL_HEIGHT / 2; break;
    }

    let finalW = targetW;
    let finalH = targetH;
    let finalX = targetX;
    let finalY = targetY;

    if (preserveAspect) {
      const currentAr = source.transform.width / source.transform.height;
      if (targetW / targetH > currentAr) {
        // Target is wider than needed, limit by height
        finalH = targetH;
        finalW = targetH * currentAr;
      } else {
        // Target is taller than needed, limit by width
        finalW = targetW;
        finalH = targetW / currentAr;
      }
      // Determine alignment based on preset
      if (preset.includes('left')) {
        finalX = targetX; // Align to left edge
      } else if (preset.includes('right')) {
        finalX = targetX + targetW - finalW; // Align to right edge
      } else {
        finalX = targetX + (targetW - finalW) / 2; // Center horizontally
      }

      if (preset.includes('top')) {
        finalY = targetY; // Align to top edge
      } else if (preset.includes('bottom')) {
        finalY = targetY + targetH - finalH; // Align to bottom edge
      } else {
        finalY = targetY + (targetH - finalH) / 2; // Center vertically
      }
    }

    dispatch({ 
      type: 'UPDATE_SOURCE', 
      payload: { 
        sceneId: activeScene.id, 
        sourceId: source.id, 
        updates: { transform: { ...source.transform, x: finalX, y: finalY, width: finalW, height: finalH } } 
      } 
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="px-4 py-3 border-b border-slate-200 bg-white sticky top-0 shadow-sm z-10 flex items-center justify-between">
        <h2 className="text-slate-700 font-bold text-sm truncate">{source.name}</h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B4FF] bg-blue-50 px-2 py-0.5 rounded">{source.type}</span>
      </div>
      
      <div className="p-4 space-y-6">
        
        {/* Quick Position */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wide">Quick Position</h3>
            </div>
            
            <label className="flex items-center cursor-pointer bg-blue-50 hover:bg-blue-100 text-[#00B4FF] px-2 py-1 rounded-full transition-colors">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span className="text-[10px] font-bold">Preserve Aspect</span>
              <input type="checkbox" className="sr-only" checked={preserveAspect} onChange={(e) => setPreserveAspect(e.target.checked)} />
              <div className={`ml-2 w-5 h-3 rounded-full flex items-center transition-colors ${preserveAspect ? 'bg-[#00B4FF]' : 'bg-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full bg-white shadow-sm transform transition-transform ${preserveAspect ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
          
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              
              <button onClick={() => handleQuickPosition('top-left')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Top Left</span>
              </button>

              <button onClick={() => handleQuickPosition('top-half')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Top Half</span>
              </button>

              <button onClick={() => handleQuickPosition('top-right')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Top Right</span>
              </button>

              <button onClick={() => handleQuickPosition('left-half')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute top-0 left-0 w-1/2 h-full bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Left Half</span>
              </button>

              <button onClick={() => handleQuickPosition('full')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-slate-300 rounded-sm mb-1 relative overflow-hidden bg-[#00B4FF] opacity-80 group-hover:border-[#00B4FF]">
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Full Screen</span>
              </button>

              <button onClick={() => handleQuickPosition('right-half')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Right Half</span>
              </button>

              <button onClick={() => handleQuickPosition('bottom-left')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Bottom Left</span>
              </button>

              <button onClick={() => handleQuickPosition('bottom-half')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Bottom Half</span>
              </button>

              <button onClick={() => handleQuickPosition('bottom-right')} className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 hover:border-[#00B4FF] hover:bg-blue-50 transition-all group">
                <div className="w-8 h-5 border border-dashed border-slate-300 rounded-sm mb-1 relative overflow-hidden group-hover:border-[#00B4FF]">
                  <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#00B4FF] opacity-80" />
                </div>
                <span className="text-[9px] text-slate-500 font-medium">Bottom Right</span>
              </button>

            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="text-[10px] text-slate-400 font-semibold">Rotation (Degrees)</label>
              <div className="relative w-20">
                <input type="number" value={Math.round(source.transform.rotation)} onChange={e => updateTransform('rotation', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#00B4FF]" />
                <span className="absolute right-2 top-1 text-slate-400 text-xs">°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blending / Opacity */}
        <div>
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wide">Blending</h3>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex items-center">
            <span className="text-xs text-slate-500 font-medium w-14">Opacity</span>
            <input type="range" min="0" max="100" value={source.opacity * 100} onChange={e => updateOpacity(e.target.value)} className="flex-1 mx-3 accent-[#00B4FF]" />
            <span className="text-xs font-bold text-slate-700 w-8 text-right">{Math.round(source.opacity * 100)}%</span>
          </div>
        </div>

        {/* Crop */}
        <div>
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
            <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wide">Crop</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
              <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-1.5 border-r border-slate-200">L</span>
              <input type="number" value={source.crop.left} onChange={e => updateCrop('left', e.target.value)} className="w-full px-2 py-1.5 text-sm text-slate-700 outline-none" />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
              <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-1.5 border-r border-slate-200">R</span>
              <input type="number" value={source.crop.right} onChange={e => updateCrop('right', e.target.value)} className="w-full px-2 py-1.5 text-sm text-slate-700 outline-none" />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
              <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-1.5 border-r border-slate-200">T</span>
              <input type="number" value={source.crop.top} onChange={e => updateCrop('top', e.target.value)} className="w-full px-2 py-1.5 text-sm text-slate-700 outline-none" />
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
              <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-1.5 border-r border-slate-200">B</span>
              <input type="number" value={source.crop.bottom} onChange={e => updateCrop('bottom', e.target.value)} className="w-full px-2 py-1.5 text-sm text-slate-700 outline-none" />
            </div>
          </div>
        </div>

        {/* Text Specific Options */}
        {source.type === 'text' && (
          <div>
            <div className="flex items-center mb-3">
              <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wide">Text Settings</h3>
            </div>
            
            <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
              <textarea 
                value={source.text}
                onChange={e => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { text: e.target.value } } })}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#00B4FF] mb-3 h-20 resize-none transition-colors"
                placeholder="Enter text..."
              />
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Size</label>
                  <input type="number" value={source.fontSize} onChange={e => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { fontSize: Number(e.target.value) } } })} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Color</label>
                  <div className="w-12 h-[30px] rounded border border-slate-200 overflow-hidden">
                    <input type="color" value={source.color} onChange={e => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { color: e.target.value } } })} className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <FilterPanel sourceId={source.id} />
    </div>
  );
};
