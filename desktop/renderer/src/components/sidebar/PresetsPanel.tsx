import React, { useState } from 'react';
import { PanelContainer } from '../ui/PanelComponents';
import { 
  Plus, LayoutTemplate, MapPin, Edit2, XCircle, Lock, Unlock,
  Image as ImageIcon, Presentation, FileText, Network, 
  Smartphone, Video, Monitor, Type, LayoutGrid 
} from 'lucide-react';
import { useScenes } from '../../context/SceneContext';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  selectedSourceId?: string | null;
  onSelectSource?: (id: string | null) => void;
}

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'camera': return <Video className="w-3.5 h-3.5 mr-2 text-blue-400" />;
    case 'screen': return <Monitor className="w-3.5 h-3.5 mr-2 text-indigo-400" />;
    case 'image': return <ImageIcon className="w-3.5 h-3.5 mr-2 text-green-500" />;
    case 'pdf': return <FileText className="w-3.5 h-3.5 mr-2 text-red-500" />;
    case 'text': return <Type className="w-3.5 h-3.5 mr-2 text-purple-500" />;
    default: return <MapPin className="w-3.5 h-3.5 mr-2 text-[#00B4FF]" strokeWidth={2.5} />;
  }
};

export const PresetsPanel = ({ selectedSourceId, onSelectSource }: Props) => {
  const { state, dispatch, activeScene } = useScenes();
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddNewLayer = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation();
    if (activeScene?.id !== sceneId) {
      dispatch({ type: 'SELECT_SCENE', payload: { id: sceneId } });
    }
    setTimeout(() => {
      const rect = (e.target as HTMLElement).closest('.layer-add-btn')!.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('open-source-menu', { detail: { x: rect.left, y: rect.bottom } }));
    }, 10);
  };

  const handleAddPreset = () => {
    dispatch({ type: 'ADD_SCENE', payload: { name: `Preset ${state.scenes.length + 1}` } });
  };

  const startEditing = (e: React.MouseEvent, sceneId: string, currentName: string) => {
    e.stopPropagation();
    setEditingSceneId(sceneId);
    setEditName(currentName);
  };

  const saveEdit = (sceneId: string) => {
    if (editName.trim()) {
      dispatch({ type: 'RENAME_SCENE', payload: { id: sceneId, name: editName.trim() } });
    }
    setEditingSceneId(null);
  };

  const deletePreset = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_SCENE', payload: { id: sceneId } });
  };

  const toggleLock = (e: React.MouseEvent, sceneId: string, sourceId: string, locked: boolean) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId, sourceId, updates: { locked: !locked } } });
  };

  const deleteSource = (e: React.MouseEvent, sceneId: string, sourceId: string) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_SOURCE', payload: { sceneId, sourceId } });
    if (selectedSourceId === sourceId) onSelectSource?.(null);
  };

  return (
    <PanelContainer>
      {/* PRESETS SECTION HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PRESETS</h2>
        <button onClick={handleAddPreset} className="text-slate-400 hover:text-slate-600 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-col text-[13px] text-slate-600">
        {state.scenes.map(scene => {
          const isActive = activeScene?.id === scene.id;
          const isEditing = editingSceneId === scene.id;

          return (
            <div key={scene.id} className="flex flex-col">
              {/* Preset Header */}
              <div 
                onClick={() => dispatch({ type: 'SELECT_SCENE', payload: { id: scene.id } })}
                className={`group flex items-center px-4 py-2 cursor-pointer transition-colors relative border-b border-slate-100 ${
                  isActive ? 'bg-[#f0f9ff]' : 'hover:bg-slate-50'
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00B4FF]"></div>}
                <LayoutTemplate className={`w-4 h-4 mr-2 ${isActive ? 'text-[#00B4FF]' : 'text-slate-400'}`} />
                
                {isEditing ? (
                  <input
                    autoFocus
                    className="flex-1 bg-white border border-[#00B4FF] px-2 py-0.5 rounded text-[13px] outline-none text-slate-700"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => saveEdit(scene.id)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(scene.id)}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className={`flex-1 ${isActive ? 'text-slate-700' : 'text-slate-600'}`}>
                    {scene.name}
                  </span>
                )}

                {/* Edit / Delete actions */}
                {!isEditing && (
                  <div className={`flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                    <button 
                      onClick={(e) => startEditing(e, scene.id, scene.name)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => deletePreset(e, scene.id)}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <XCircle className="w-4 h-4 fill-current" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Children of Preset */}
              {isActive && (
                <div className="flex flex-col bg-[#f8fafc] py-1 border-b border-slate-100">
                  {/* Add New Layer Row */}
                  <div 
                    className="layer-add-btn flex items-center pl-10 pr-4 py-1.5 hover:bg-slate-100 cursor-pointer text-slate-500 transition-colors"
                    onClick={(e) => handleAddNewLayer(e, scene.id)}
                  >
                    <div className="w-3.5 h-3.5 mr-2 border border-[#00B4FF] rounded-sm flex items-center justify-center text-[#00B4FF] bg-blue-50/50">
                      <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                    </div>
                    <span>Add new layer</span>
                  </div>
                  
                  {/* Layers List */}
                  {[...scene.sources].filter(s => s.type !== 'lower-third').sort((a, b) => b.zIndex - a.zIndex).map(source => (
                    <div 
                      key={source.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSource?.(source.id);
                      }}
                      className={`group flex items-center pl-10 pr-4 py-1.5 cursor-pointer transition-colors ${
                        selectedSourceId === source.id 
                          ? 'bg-slate-200/50 text-[#00B4FF] font-medium' 
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {getSourceIcon(source.type)}
                      <span className="truncate flex-1">{source.name}</span>
                      
                      {/* Hover actions for source */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => toggleLock(e, scene.id, source.id, !!source.locked)}
                          className={`p-0.5 hover:text-slate-600 ${source.locked ? 'text-slate-500' : 'text-slate-400'}`}
                          title={source.locked ? 'Unlock layer' : 'Lock layer'}
                        >
                          {source.locked ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button 
                          onClick={(e) => deleteSource(e, scene.id, source.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                          title="Delete layer"
                        >
                          <XCircle className="w-4 h-4 fill-current text-white" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PanelContainer>
  );
};

