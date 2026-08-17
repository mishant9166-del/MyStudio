import { useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import { Sliders, RefreshCw, X } from 'lucide-react';
// @ts-ignore - TS thinks these are unused but they are used in type casts
import type { VideoFilter, ColorFilter, ChromaKeyFilter, BlurFilter, SharpenFilter, CropFilter } from '../../context/FilterContext';

interface Props {
  sourceId: string;
}

export const FilterPanel = ({ sourceId }: Props) => {
  const { sourceFilters, addFilter, updateFilter, removeFilter, toggleFilter, reorderFilters } = useFilters();
  const filters = sourceFilters[sourceId] || [];
  const [showAddMenu, setShowAddMenu] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleAddFilter = (type: VideoFilter['type']) => {
    let newFilter: any = { id: generateId(), type, enabled: true };
    
    if (type === 'color') {
      newFilter = { ...newFilter, name: 'Color Correction', brightness: 0, contrast: 1.0, saturation: 1.0, gamma: 1.0, hue: 0 };
    } else if (type === 'chroma') {
      newFilter = { ...newFilter, name: 'Chroma Key', targetColorR: 0, targetColorG: 255, targetColorB: 0, tolerance: 0.1, spillReduction: 0.5 };
    } else if (type === 'blur') {
      newFilter = { ...newFilter, name: 'Blur', amount: 5 };
    } else if (type === 'sharpen') {
      newFilter = { ...newFilter, name: 'Sharpen', amount: 0.5 };
    } else if (type === 'crop') {
      newFilter = { ...newFilter, name: 'Crop', left: 0, right: 0, top: 0, bottom: 0 };
    }

    addFilter(sourceId, newFilter);
    setShowAddMenu(false);
  };

  const moveUp = (index: number) => {
    if (index > 0) reorderFilters(sourceId, index, index - 1);
  };

  const moveDown = (index: number) => {
    if (index < filters.length - 1) reorderFilters(sourceId, index, index + 1);
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wide">Filters</h3>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="text-[10px] bg-[#00B4FF] text-white px-2 py-1 rounded font-bold hover:bg-blue-400 transition-colors"
          >
            + Add Filter
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded py-1 z-20">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color</div>
              <button onClick={() => handleAddFilter('color')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Color Correction</button>
              
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-slate-100">Blur</div>
              <button onClick={() => handleAddFilter('blur')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Blur</button>
              <button onClick={() => handleAddFilter('sharpen')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Sharpen</button>
              
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 border-t border-slate-100">Background</div>
              <button onClick={() => handleAddFilter('chroma')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Chroma Key</button>
              <button onClick={() => handleAddFilter('crop')} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Crop</button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filters.length === 0 ? (
          <div className="text-center text-xs text-slate-400 italic py-4 bg-slate-100 rounded">No filters added</div>
        ) : (
          filters.map((filter, index) => (
            <div key={filter.id} className="bg-white border border-slate-200 rounded overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={filter.enabled} 
                    onChange={() => toggleFilter(sourceId, filter.id)}
                    className="mr-2"
                  />
                  <span className="text-xs font-bold text-slate-700">{filter.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveDown(index)} disabled={index === filters.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => removeFilter(sourceId, filter.id)} className="p-1 text-red-400 hover:text-red-600 ml-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              {/* Filter Properties */}
              {filter.enabled && (
                <div className="p-3 text-xs space-y-3">
                  {filter.type === 'color' && (
                    <>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>Brightness</span>
                          <span>{(filter as ColorFilter).brightness}</span>
                        </label>
                        <input type="range" min="-100" max="100" value={(filter as ColorFilter).brightness} onChange={e => updateFilter(sourceId, filter.id, { brightness: parseInt(e.target.value) })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>Contrast</span>
                          <span>{(filter as ColorFilter).contrast.toFixed(2)}</span>
                        </label>
                        <input type="range" min="0" max="2" step="0.05" value={(filter as ColorFilter).contrast} onChange={e => updateFilter(sourceId, filter.id, { contrast: parseFloat(e.target.value) })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>Saturation</span>
                          <span>{(filter as ColorFilter).saturation.toFixed(2)}</span>
                        </label>
                        <input type="range" min="0" max="2" step="0.05" value={(filter as ColorFilter).saturation} onChange={e => updateFilter(sourceId, filter.id, { saturation: parseFloat(e.target.value) })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>Hue</span>
                          <span>{(filter as ColorFilter).hue}°</span>
                        </label>
                        <input type="range" min="-180" max="180" value={(filter as ColorFilter).hue} onChange={e => updateFilter(sourceId, filter.id, { hue: parseInt(e.target.value) })} className="w-full" />
                      </div>
                      <button onClick={() => updateFilter(sourceId, filter.id, { brightness: 0, contrast: 1.0, saturation: 1.0, gamma: 1.0, hue: 0 })} className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold">Reset</button>
                    </>
                  )}

                  {filter.type === 'chroma' && (
                    <>
                      <div className="flex space-x-2 items-center">
                        <label className="block text-[10px] text-slate-400">Key Color</label>
                        <input 
                          type="color" 
                          value={`#${((filter as ChromaKeyFilter).targetColorR << 16 | (filter as ChromaKeyFilter).targetColorG << 8 | (filter as ChromaKeyFilter).targetColorB).toString(16).padStart(6, '0')}`}
                          onChange={e => {
                            const hex = e.target.value;
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            updateFilter(sourceId, filter.id, { targetColorR: r, targetColorG: g, targetColorB: b });
                          }}
                          className="w-8 h-8 rounded border-none p-0 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>Tolerance</span>
                          <span>{(filter as ChromaKeyFilter).tolerance.toFixed(2)}</span>
                        </label>
                        <input type="range" min="0" max="1" step="0.01" value={(filter as ChromaKeyFilter).tolerance} onChange={e => updateFilter(sourceId, filter.id, { tolerance: parseFloat(e.target.value) })} className="w-full" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                          <span>Spill Reduction</span>
                          <span>{(filter as ChromaKeyFilter).spillReduction.toFixed(2)}</span>
                        </label>
                        <input type="range" min="0" max="1" step="0.01" value={(filter as ChromaKeyFilter).spillReduction} onChange={e => updateFilter(sourceId, filter.id, { spillReduction: parseFloat(e.target.value) })} className="w-full" />
                      </div>
                    </>
                  )}
                  
                  {filter.type === 'blur' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                        <span>Amount</span>
                        <span>{(filter as BlurFilter).amount}</span>
                      </label>
                      <input type="range" min="0" max="50" value={(filter as BlurFilter).amount} onChange={e => updateFilter(sourceId, filter.id, { amount: parseInt(e.target.value) })} className="w-full" />
                    </div>
                  )}

                  {filter.type === 'sharpen' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 flex justify-between">
                        <span>Amount</span>
                        <span>{(filter as SharpenFilter).amount.toFixed(2)}</span>
                      </label>
                      <input type="range" min="0" max="2" step="0.05" value={(filter as SharpenFilter).amount} onChange={e => updateFilter(sourceId, filter.id, { amount: parseFloat(e.target.value) })} className="w-full" />
                    </div>
                  )}

                  {filter.type === 'crop' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-[10px] text-slate-400">Left</label><input type="number" value={(filter as CropFilter).left} onChange={e => updateFilter(sourceId, filter.id, { left: parseInt(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                      <div><label className="block text-[10px] text-slate-400">Right</label><input type="number" value={(filter as CropFilter).right} onChange={e => updateFilter(sourceId, filter.id, { right: parseInt(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                      <div><label className="block text-[10px] text-slate-400">Top</label><input type="number" value={(filter as CropFilter).top} onChange={e => updateFilter(sourceId, filter.id, { top: parseInt(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                      <div><label className="block text-[10px] text-slate-400">Bottom</label><input type="number" value={(filter as CropFilter).bottom} onChange={e => updateFilter(sourceId, filter.id, { bottom: parseInt(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
