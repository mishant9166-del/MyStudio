import { useState, useEffect } from 'react';
import { useScenes } from '../../context/SceneContext';
import type { SceneSource, CameraDevice, DisplayDevice } from '../../../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

import { ContextMenu } from '../ui/ContextMenu';
import type { ContextMenuItem } from '../ui/ContextMenu';
import { 
  Image as ImageIcon, 
  Presentation, 
  FileText, 
  Network, 
  Smartphone, 
  Video, 
  Monitor, 
  PlaySquare, 
  Palette, 
  Link2, 
  Radio, 
  Gamepad2, 
  PlusSquare, 
  Layers, 
  Settings,
  Type 
} from 'lucide-react';

interface Props {
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
}

export const SourcePanel = ({ selectedSourceId, onSelectSource }: Props) => {
  const { dispatch, activeScene } = useScenes();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [displays, setDisplays] = useState<DisplayDevice[]>([]);

  useEffect(() => {
    window.electronAPI.getCameras().then(setCameras).catch(() => {});
    window.electronAPI.getDisplays().then(setDisplays).catch(() => {});

    const handleOpenMenu = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number, y: number }>;
      setMenuPos({ x: customEvent.detail.x, y: customEvent.detail.y });
    };
    window.addEventListener('open-source-menu', handleOpenMenu);
    return () => window.removeEventListener('open-source-menu', handleOpenMenu);
  }, []);

  if (!activeScene) {
    return <div className="p-4 text-slate-400 text-sm">Select a preset first.</div>;
  }

  const handleAddCamera = (device: CameraDevice) => {
    const newId = uuidv4();
    dispatch({ type: 'ADD_SOURCE', payload: { sceneId: activeScene.id, source: { id: newId, type: 'camera', name: device.name, deviceId: device.id, visible: true, locked: false, zIndex: 0, opacity: 1, transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0 }, crop: { left: 0, right: 0, top: 0, bottom: 0 } } } });
    onSelectSource(newId);
  };

  const handleAddDisplay = (device: DisplayDevice) => {
    const newId = uuidv4();
    dispatch({ type: 'ADD_SOURCE', payload: { sceneId: activeScene.id, source: { id: newId, type: 'screen', name: device.name, displayId: device.id, visible: true, locked: false, zIndex: 0, opacity: 1, transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0 }, crop: { left: 0, right: 0, top: 0, bottom: 0 } } } });
    onSelectSource(newId);
  };

  const handleAddImage = async () => {
    const filePath = await window.electronAPI.selectImageFile();
    if (filePath) {
      const fileName = filePath.split(/[/\\]/).pop() || 'Image';
      const newId = uuidv4();
      dispatch({ type: 'ADD_SOURCE', payload: { sceneId: activeScene.id, source: { id: newId, type: 'image', name: fileName, filePath, visible: true, locked: false, zIndex: 0, opacity: 1, transform: { x: 500, y: 300, width: 400, height: 400, rotation: 0 }, crop: { left: 0, right: 0, top: 0, bottom: 0 } } } });
      onSelectSource(newId);
    }
  };

  const handleAddPdf = async () => {
    const filePath = await window.electronAPI.selectDocumentFile();
    if (filePath) {
      const fileName = filePath.split(/[/\\]/).pop() || 'PDF Document';
      const newId = uuidv4();
      
      dispatch({ 
        type: 'ADD_SOURCE', 
        payload: { 
          sceneId: activeScene.id, 
          source: { 
            id: newId, 
            type: 'pdf', 
            name: fileName, 
            file: filePath, 
            currentPage: 1, 
            totalPages: 1, 
            scrollOffset: 0, 
            visible: true, 
            locked: false, 
            zIndex: 10, 
            opacity: 1, 
            zoom: 1.5,
            transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0 }, 
            crop: { left: 0, right: 0, top: 0, bottom: 0 } 
          } 
        } 
      });
      
      onSelectSource(newId);
    }
  };

  const handleAddPowerPoint = async () => {
    const filePath = await (window as any).electronAPI.selectPowerPointFile();
    if (filePath) {
      const fileName = filePath.split(/[/\\]/).pop() || 'PowerPoint Presentation';
      const newId = uuidv4();
      dispatch({ 
        type: 'ADD_SOURCE', 
        payload: { 
          sceneId: activeScene.id, 
          source: { 
            id: newId, 
            type: 'powerpoint', 
            name: fileName, 
            file: filePath, 
            visible: true, 
            locked: false, 
            zIndex: 10, 
            opacity: 1, 
            transform: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0 }, 
            crop: { left: 2, right: -2, top: 73, bottom: 43 } 
          } 
        } 
      });
      onSelectSource(newId);
    }
  };

  const handleAddText = () => {
    const newId = uuidv4();
    dispatch({ type: 'ADD_SOURCE', payload: { sceneId: activeScene.id, source: { id: newId, type: 'text', name: 'Text', text: 'MY STREAM', fontSize: 72, fontFamily: 'Arial', color: '#ffffff', fontWeight: 'bold', visible: true, locked: false, zIndex: 0, opacity: 1, transform: { x: 100, y: 100, width: 400, height: 100, rotation: 0 }, crop: { left: 0, right: 0, top: 0, bottom: 0 } } } });
    onSelectSource(newId);
  };

  const toggleVisibility = (source: SceneSource, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { visible: !source.visible } } });
  };

  const toggleLock = (source: SceneSource, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { locked: !source.locked } } });
  };

  const deleteSource = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_SOURCE', payload: { sceneId: activeScene.id, sourceId } });
    if (selectedSourceId === sourceId) onSelectSource(null);
  };

  const reorder = (sourceId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REORDER_SOURCE', payload: { sceneId: activeScene.id, sourceId, direction } });
  };

  const sortedSources = [...activeScene.sources].sort((a, b) => b.zIndex - a.zIndex);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const menuItems: ContextMenuItem[] = [
    {
      id: 'header',
      label: activeScene.name,
      type: 'header'
    },
    {
      id: 'images',
      label: 'Images & Videos',
      icon: <ImageIcon className="text-green-500" />,
      onClick: handleAddImage
    },
    {
      id: 'powerpoint',
      label: 'PowerPoint',
      icon: <Presentation className="text-orange-500" />,
      onClick: handleAddPowerPoint
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: <FileText className="text-red-500" />,
      onClick: handleAddPdf
    },
    {
      id: 'text',
      label: 'Text',
      icon: <Type className="text-purple-500" />,
      onClick: handleAddText
    },
    {
      id: 'ndi',
      label: 'NDI® Input',
      icon: <Network className="text-slate-800" />,
      items: [{ id: 'ndi-empty', label: 'No NDI Sources Found' }]
    },
    {
      id: 'mobile',
      label: 'Mobile Device',
      icon: <Smartphone className="text-blue-500" />
    },
    {
      id: 'ip-cameras',
      label: 'IP Cameras',
      icon: <Video className="text-blue-500" />,
      items: [{ id: 'ip-empty', label: 'No IP Cameras' }]
    },
    {
      id: 'cameras',
      label: 'Cameras',
      icon: <Video className="text-blue-400" />,
      items: cameras.length ? cameras.map(c => ({
        id: c.id,
        label: c.name,
        onClick: () => handleAddCamera(c)
      })) : [{ id: 'no-cam', label: 'No cameras found' }]
    },
    {
      id: 'desktop',
      label: 'Desktop',
      icon: <Monitor className="text-blue-400" />,
      items: displays.length ? displays.map(d => ({
        id: d.id,
        label: d.name,
        onClick: () => handleAddDisplay(d)
      })) : [{ id: 'no-disp', label: 'No displays found' }]
    },
    {
      id: 'youtube',
      label: 'YouTube URL',
      icon: <PlaySquare className="text-red-600" />
    },
    {
      id: 'color',
      label: 'Color Source',
      icon: <Palette className="text-purple-400" />,
      items: [{ id: 'solid-color', label: 'Solid Color' }]
    },
    {
      id: 'web',
      label: 'Web source URL',
      icon: <Link2 className="text-blue-500" />
    },
    {
      id: 'rtmp',
      label: 'RTMP servers',
      icon: <Radio className="text-orange-500" />,
      items: [{ id: 'rtmp-start', label: 'Start RTMP Server' }]
    },
    {
      id: 'game',
      label: 'Game',
      icon: <Gamepad2 className="text-yellow-500" />,
      items: [{ id: 'game-empty', label: 'No games running' }]
    },
    { id: 'sep1', label: '-', type: 'separator' },
    {
      id: 'add-layer',
      label: 'Add new layer',
      icon: <PlusSquare className="text-slate-400" />,
      shortcut: 'Ctrl+N'
    },
    {
      id: 'manage',
      label: 'Manage layers',
      icon: <Layers className="text-slate-400" />,
      items: [{ id: 'clear', label: 'Clear all layers' }]
    },
    {
      id: 'props',
      label: 'Properties',
      icon: <Settings className="text-slate-400" />
    }
  ];

  return (
    <div 
      className="p-4 flex flex-col h-full bg-white relative"
      onContextMenu={handleContextMenu}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-slate-700 font-bold tracking-wide text-sm">SOURCES & LAYERS</h2>
        <button 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPos({ x: rect.left, y: rect.bottom });
          }}
          className="text-xs text-[#00B4FF] font-semibold hover:text-blue-500 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add layer
        </button>
      </div>

      {menuPos && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          items={menuItems}
          onClose={() => setMenuPos(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {sortedSources.length === 0 ? (
          <div className="text-sm text-slate-400 italic text-center mt-8">No layers in this preset.</div>
        ) : sortedSources.map(source => (
          <div key={source.id} className="flex flex-col">
            <div 
              onClick={() => onSelectSource(source.id)}
              className={`group flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-colors border ${
                selectedSourceId === source.id 
                  ? 'bg-[#F2F7F9] border-[#00B4FF] shadow-sm' 
                  : 'bg-white border-transparent hover:bg-slate-50'
              }`}
            >
              {/* Toggles */}
              <button onClick={(e) => toggleVisibility(source, e)} className={`w-6 flex justify-center mr-1 ${source.visible ? 'text-slate-600 hover:text-[#00B4FF]' : 'text-slate-300'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
              <button onClick={(e) => toggleLock(source, e)} className={`w-6 flex justify-center mr-2 ${source.locked ? 'text-[#00B4FF]' : 'text-slate-300 group-hover:text-slate-400'}`}>
                {source.locked ? '🔒' : '🔓'}
              </button>

              <span className={`flex-1 text-sm truncate font-medium ${selectedSourceId === source.id ? 'text-[#00B4FF]' : 'text-slate-700'}`}>{source.name}</span>

              {/* Actions (visible on hover) */}
              <div className="opacity-0 group-hover:opacity-100 flex space-x-0.5 transition-opacity bg-slate-50/90 rounded px-1">
                <button onClick={(e) => reorder(source.id, 'up', e)} className="text-slate-400 hover:text-[#00B4FF] p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg></button>
                <button onClick={(e) => reorder(source.id, 'down', e)} className="text-slate-400 hover:text-[#00B4FF] p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg></button>
                <button onClick={(e) => deleteSource(source.id, e)} className="text-slate-400 hover:text-red-500 p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            </div>
            
            {source.type === 'pdf' && selectedSourceId === source.id && (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-x border-b border-[#00B4FF]/30 rounded-b-md mb-1 -mt-1 text-xs text-slate-600 shadow-sm">
                 <button 
                   disabled={!source.currentPage || source.currentPage <= 1} 
                   onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { currentPage: (source.currentPage || 1) - 1 } } })}
                   className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous Page</button>
                 <span className="font-medium">Page {source.currentPage || 1} / {source.totalPages || 1}</span>
                 <button 
                   disabled={!source.totalPages || (source.currentPage || 1) >= source.totalPages} 
                   onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { currentPage: (source.currentPage || 1) + 1 } } })}
                   className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next Page</button>
              </div>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );
};
