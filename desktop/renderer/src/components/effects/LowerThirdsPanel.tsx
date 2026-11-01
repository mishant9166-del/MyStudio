import React, { useState } from 'react';
import { PanelContainer, PanelSection } from '../ui/PanelComponents';
import { X, Edit2, Play, Square, ChevronDown } from 'lucide-react';
import { useScenes } from '../../context/SceneContext';
import type { LowerThirdSource } from '../../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { LowerThirdEditor } from './LowerThirdEditor';
import { renderThemePreview } from './LowerThirdTemplates';



export const LowerThirdsPanel = () => {
  const { activeScene, dispatch } = useScenes();
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [originalSnapshot, setOriginalSnapshot] = useState<LowerThirdSource | null>(null);

  if (!activeScene) return <PanelContainer><div className="p-4 text-slate-400">No scene selected.</div></PanelContainer>;

  const lowerThirds = activeScene.sources.filter((s): s is LowerThirdSource => s.type === 'lower-third');

  const handleAdd = () => {
    const newSource: LowerThirdSource = {
      id: uuidv4(),
      type: 'lower-third',
      name: `Lower Third ${lowerThirds.length + 1}`,
      visible: true,
      isShowing: true,
      locked: false,
      zIndex: 10,
      opacity: 1,
      title: 'Title',
      subtitle: 'Subtitle',
      theme: 'theme-cyan',
      transform: { x: 0, y: 580, width: 1920, height: 600, rotation: 0 },
      crop: { left: 0, right: 0, top: 0, bottom: 0 }
    };
    dispatch({ type: 'ADD_SOURCE', payload: { sceneId: activeScene.id, source: newSource } });
    setIsCreatingNew(true);
    setEditingSourceId(newSource.id); // Open editor immediately
  };

  const handleEdit = (lt: LowerThirdSource) => {
    setOriginalSnapshot(JSON.parse(JSON.stringify(lt)));
    setEditingSourceId(lt.id);
    setIsCreatingNew(false);
  };

  const updateSource = (sourceId: string, updates: Partial<LowerThirdSource>) => {
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId, updates } });
  };

  const removeSource = (sourceId: string) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: { sceneId: activeScene.id, sourceId } });
  };



  return (
    <PanelContainer>
      <PanelSection title="Lower Thirds">
        <div className="flex flex-col space-y-4">
          {lowerThirds.map(lt => (
            <div key={lt.id} className="border border-slate-200 rounded-md bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 bg-slate-50/50">
                <span className="text-slate-500 text-[13px] font-medium truncate max-w-[140px]">{lt.name}</span>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => handleEdit(lt)} className="text-slate-400 hover:text-[#00B4FF] transition-colors" title="Edit">
                    <Edit2 className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                  <button type="button" onClick={() => updateSource(lt.id, { visible: !lt.visible })} className={`w-6 h-3.5 rounded-full relative transition-colors ${lt.visible ? 'bg-indigo-500' : 'bg-slate-300'}`} title="Toggle Visibility">
                    <div className={`absolute top-[2px] left-[2px] w-2.5 h-2.5 rounded-full bg-white transition-transform ${lt.visible ? 'translate-x-2.5' : 'translate-x-0'}`}></div>
                  </button>
                  <button type="button" onClick={() => removeSource(lt.id)} className="text-white bg-red-400 hover:bg-red-500 rounded-full p-0.5 ml-1 transition-colors" title="Delete">
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              
              <div className="p-3 flex flex-col space-y-3">
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <label className="text-[12px] font-semibold text-slate-500">Title</label>
                    <span className="text-[10px] text-slate-400 font-medium">{lt.title.length}/42</span>
                  </div>
                  <input 
                    type="text" 
                    maxLength={42}
                    className="w-full border border-slate-200 rounded p-1.5 text-[13px] focus:outline-none focus:border-[#00B4FF] text-slate-700 bg-slate-50 focus:bg-white transition-colors" 
                    value={lt.title} 
                    onChange={e => updateSource(lt.id, { title: e.target.value })} 
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <label className="text-[12px] font-semibold text-slate-500">Subtitle</label>
                    <span className="text-[10px] text-slate-400 font-medium">{lt.subtitle.length}/52</span>
                  </div>
                  <textarea 
                    maxLength={52}
                    className="w-full border border-slate-200 rounded p-1.5 text-[13px] focus:outline-none focus:border-[#00B4FF] text-slate-700 bg-slate-50 focus:bg-white transition-colors h-16 resize-none" 
                    value={lt.subtitle} 
                    onChange={e => updateSource(lt.id, { subtitle: e.target.value })}
                  />
                </div>

                <div className="flex flex-col pt-1">
                  <div 
                    className="w-full bg-white border border-slate-200 hover:border-[#00B4FF] rounded-[4px] p-1 flex items-center justify-center cursor-pointer transition-colors overflow-hidden"
                    onClick={() => handleEdit(lt)}
                    title="Open Editor"
                  >
                    {renderThemePreview(lt.theme)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {lowerThirds.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
              No lower thirds added yet.
            </div>
          )}
        </div>

        <button type="button" onClick={handleAdd} className="w-full mt-3 py-2 bg-[#00B4FF] hover:bg-[#009ce0] text-white rounded font-medium transition-colors">
          Add a new Lower Third
        </button>
      </PanelSection>
      <div className="h-8"></div>
      
      {editingSourceId && (
        <LowerThirdEditor 
          sourceId={editingSourceId} 
          isNew={isCreatingNew}
          onSave={() => {
            setEditingSourceId(null);
            setIsCreatingNew(false);
            setOriginalSnapshot(null);
          }}
          onCancel={() => {
            if (isCreatingNew) {
              removeSource(editingSourceId);
            } else if (originalSnapshot) {
              updateSource(editingSourceId, originalSnapshot);
            }
            setEditingSourceId(null);
            setIsCreatingNew(false);
            setOriginalSnapshot(null);
          }}
          onClose={() => {
            if (isCreatingNew) {
              removeSource(editingSourceId);
            } else if (originalSnapshot) {
              updateSource(editingSourceId, originalSnapshot);
            }
            setEditingSourceId(null);
            setIsCreatingNew(false);
            setOriginalSnapshot(null);
          }} 
        />
      )}
    </PanelContainer>
  );
};





