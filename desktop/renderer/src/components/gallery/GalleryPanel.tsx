import React, { useState, useEffect } from 'react';
import { PanelContainer } from '../ui/PanelComponents';
import { Copy, MonitorPlay, Image as ImageIcon, Search, Plus, Equal, LayoutGrid, Aperture, X, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export const GalleryPanel = () => {
  const [activeTab, setActiveTab] = useState<'albums' | 'recordings' | 'snapshots'>('albums');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  interface Snapshot {
    name: string;
    path: string;
    dataUrl?: string;
  }
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    const loadSnapshots = async () => {
      let folderPath = localStorage.getItem('mystudio_snapshot_path');
      if (!folderPath && (window as any).electronAPI?.getPicturesPath) {
        folderPath = await (window as any).electronAPI.getPicturesPath();
      }
      folderPath = folderPath || 'C:\\Pictures\\MyStudio';
      const prefix = localStorage.getItem('mystudio_snapshot_prefix') || 'My Snapshot';

      if ((window as any).electronAPI?.listSnapshots) {
        try {
          const files = await (window as any).electronAPI.listSnapshots(folderPath, prefix);
          setSnapshots(files);
          
          // Load thumbnails progressively
          for (const f of files) {
            if ((window as any).electronAPI?.readImageFile) {
              const dataUrl = await (window as any).electronAPI.readImageFile(f.path);
              setSnapshots(prev => prev.map(s => s.path === f.path ? { ...s, dataUrl } : s));
            }
          }
        } catch (e) {
          console.error("Failed to load snapshots:", e);
        }
      }
    };

    if (activeTab === 'snapshots' || activeTab === 'albums') {
      loadSnapshots();
    }

    window.addEventListener('snapshot-taken', loadSnapshots);
    return () => window.removeEventListener('snapshot-taken', loadSnapshots);
  }, [activeTab]);

  const [editingSnapshot, setEditingSnapshot] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, filePath: string}>({show: false, filePath: ''});
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(() => localStorage.getItem('mystudio_skip_delete_confirm') === 'true');

  const executeDelete = async (filePath: string) => {
    if ((window as any).electronAPI?.deleteSnapshot) {
       await (window as any).electronAPI.deleteSnapshot(filePath);
       setSnapshots(prev => prev.filter(s => s.path !== filePath));
    }
    setDeleteConfirm({ show: false, filePath: '' });
  };

  const handleDelete = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    if (skipDeleteConfirm) {
      executeDelete(filePath);
    } else {
      setDeleteConfirm({ show: true, filePath });
    }
  };

  const startRename = (snap: Snapshot) => {
    setEditingSnapshot(snap.path);
    setEditName(snap.name.replace(/\.[^/.]+$/, ""));
  };

  const handleRename = async (snap: Snapshot) => {
    if (!editName.trim() || editName.trim() === snap.name.replace(/\.[^/.]+$/, "")) {
       setEditingSnapshot(null);
       return;
    }
    
    if ((window as any).electronAPI?.renameSnapshot) {
       const res = await (window as any).electronAPI.renameSnapshot(snap.path, editName.trim());
       if (res && res.success) {
          setSnapshots(prev => prev.map(s => s.path === snap.path ? { ...s, name: res.newName, path: res.newPath } : s));
       }
    }
    setEditingSnapshot(null);
  };

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (viewerIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerIndex(null);
      else if (e.key === 'ArrowLeft') setViewerIndex(prev => prev !== null ? Math.max(0, prev - 1) : null);
      else if (e.key === 'ArrowRight') setViewerIndex(prev => prev !== null ? Math.min(snapshots.length - 1, prev + 1) : null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerIndex, snapshots.length]);

  return (
    <PanelContainer>
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-slate-100 relative">
        <div className="flex relative">
          {/* Sliding Blue Box */}
          <div 
            className="absolute top-0 bottom-0 w-12 bg-[#00B4FF] transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${activeTab === 'albums' ? 0 : activeTab === 'recordings' ? 48 : 96}px)`
            }}
          />
          
          <button 
            onClick={() => setActiveTab('albums')}
            className={`w-12 h-10 flex items-center justify-center relative z-10 transition-colors ${activeTab === 'albums' ? 'text-white' : 'text-[#88a8ba] hover:text-slate-600'}`}
          >
            <Copy className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
          <button 
            onClick={() => setActiveTab('recordings')}
            className={`w-12 h-10 flex items-center justify-center relative z-10 transition-colors ${activeTab === 'recordings' ? 'text-white' : 'text-[#88a8ba] hover:text-slate-600'}`}
          >
            <MonitorPlay className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
          <button 
            onClick={() => setActiveTab('snapshots')}
            className={`w-12 h-10 flex items-center justify-center relative z-10 transition-colors ${activeTab === 'snapshots' ? 'text-white' : 'text-[#88a8ba] hover:text-slate-600'}`}
          >
            <ImageIcon className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        </div>
        
        {/* Search pushed to right */}
        <div className="ml-auto flex">
          <button className="w-12 h-10 flex items-center justify-center text-[#88a8ba] hover:text-slate-600 transition-colors">
            <Search className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto">
        {/* ALBUMS Content */}
        {activeTab === 'albums' && (
          <>
            <div className="flex items-center justify-between px-3 py-2 mt-1">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ALBUMS</h2>
              <div className="flex items-center space-x-2.5 text-slate-400">
                <button className="hover:text-slate-600 transition-colors">
                  <Plus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                </button>
                <button className="hover:text-slate-600 transition-colors">
                  <Equal className="w-[14px] h-[14px]" strokeWidth={2.5} />
                </button>
                <button className="text-[#00B4FF]">
                  <LayoutGrid className="w-[14px] h-[14px]" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-3 mt-1">
              <div 
                className="flex flex-col cursor-pointer group"
                onClick={() => setActiveTab('snapshots')}
              >
                <div className={`w-full h-14 rounded-[4px] relative overflow-hidden flex items-center justify-center transition-colors ${snapshots.length > 0 ? 'bg-[#333C44] border border-slate-200' : 'bg-[#f0f9ff] border border-[#d6eaf8]'}`}>
                  {snapshots.length > 0 && snapshots[0].dataUrl ? (
                     <img src={snapshots[0].dataUrl} alt="Album Cover" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[#88a8ba]" strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-[11px] text-[#2d698e] mt-1">My snapshots</span>
              </div>

              <div 
                className="flex flex-col cursor-pointer group relative"
                onClick={() => setActiveTab('recordings')}
              >
                <div className="w-full h-14 bg-[#f0f9ff] rounded-[4px] border border-[#d6eaf8] flex items-center justify-center">
                  <Copy className="w-5 h-5 text-[#88a8ba]" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] text-[#2d698e] mt-1 pl-1">
                  My recordings
                </span>
              </div>
            </div>
          </>
        )}

        {/* MY RECORDINGS Content */}
        {activeTab === 'recordings' && (
          <>
            <div className="flex items-center justify-between px-3 py-2 mt-1">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MY RECORDINGS</h2>
              <div className="flex items-center space-x-2.5 text-slate-400">
                <button className="hover:text-slate-600 transition-colors">
                  <Equal className="w-[14px] h-[14px]" strokeWidth={2.5} />
                </button>
                <button className="text-[#00B4FF]">
                  <LayoutGrid className="w-[14px] h-[14px]" strokeWidth={2.5} />
                </button>
              </div>
            </div>
            {/* Empty state for recordings */}
          </>
        )}

        {/* MY SNAPSHOTS Content */}
        {activeTab === 'snapshots' && (
          <>
            <div className="flex items-center justify-between px-3 py-2 mt-1">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MY SNAPSHOTS</h2>
              <div className="flex items-center space-x-2.5 text-slate-400">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`transition-colors ${viewMode === 'list' ? 'text-[#00B4FF]' : 'hover:text-slate-600'}`}
                >
                  <Equal className="w-[18px] h-[18px]" strokeWidth={3.5} />
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`transition-colors ${viewMode === 'grid' ? 'text-[#00B4FF]' : 'hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-[14px] h-[14px]" strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div className={`px-3 mt-1 pb-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col space-y-3'}`}>
              {snapshots.length > 0 ? (
                snapshots.map((snap, idx) => (
                  <div key={snap.path + idx} className="flex flex-col group">
                    <div 
                      onClick={() => setViewerIndex(idx)}
                      className={`w-full bg-[#333C44] rounded-[4px] border border-slate-200 relative overflow-hidden flex items-center justify-center transition-all cursor-pointer ${viewMode === 'grid' ? 'h-20' : 'h-32'}`}
                    >
                      {snap.dataUrl ? (
                        <img src={snap.dataUrl} alt={snap.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-500 animate-pulse" />
                      )}
                      
                      {/* Delete Button Overlay */}
                      <button 
                        onClick={(e) => handleDelete(e, snap.path)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        title="Delete snapshot"
                      >
                        <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </button>

                      {/* Shutter Icon Overlay */}
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Aperture className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    {editingSnapshot === snap.path ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(snap)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(snap)}
                        className="text-[11px] text-[#2d698e] mt-1 bg-white border border-[#00B4FF] rounded px-1 outline-none w-full"
                      />
                    ) : (
                      <span 
                        className="text-[11px] text-[#2d698e] mt-1 truncate hover:text-[#00B4FF] transition-colors cursor-pointer w-full block" 
                        title={snap.name}
                        onClick={(e) => {
                           e.stopPropagation();
                           startRename(snap);
                        }}
                      >
                        {snap.name}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-4 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">No snapshots found</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="absolute inset-0 bg-slate-900/20 z-[50] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[280px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center">
                <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                Delete Snapshot
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Are you sure you want to permanently delete this snapshot? This action cannot be undone.
              </p>
              
              <label className="flex items-center space-x-2 mb-5 cursor-pointer group w-fit">
                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${skipDeleteConfirm ? 'bg-[#00B4FF] border-[#00B4FF]' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                   <input 
                     type="checkbox" 
                     checked={skipDeleteConfirm}
                     className="opacity-0 absolute w-0 h-0"
                     onChange={(e) => {
                       const val = e.target.checked;
                       setSkipDeleteConfirm(val);
                       localStorage.setItem('mystudio_skip_delete_confirm', val.toString());
                     }}
                   />
                   {skipDeleteConfirm && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-[11px] text-slate-500 select-none group-hover:text-slate-700 transition-colors">Don't show this warning again</span>
              </label>
              
              <div className="flex items-center justify-end space-x-2">
                <button 
                  onClick={() => setDeleteConfirm({ show: false, filePath: '' })}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeDelete(deleteConfirm.filePath)}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {viewerIndex !== null && snapshots[viewerIndex] && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setViewerIndex(null)}
        >
          <div 
            className="w-full max-w-4xl h-[70vh] bg-black/70 rounded-xl shadow-2xl flex flex-col ring-1 ring-white/10 overflow-hidden relative group"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the box
          >
            {/* Left Arrow */}
            {viewerIndex > 0 && (
              <button 
                onClick={() => setViewerIndex(viewerIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-50 transform hover:scale-105"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {/* Image Container */}
            <div className="flex-1 w-full h-full flex items-center justify-center p-2">
              {snapshots[viewerIndex].dataUrl ? (
                <img 
                  src={snapshots[viewerIndex].dataUrl} 
                  alt={snapshots[viewerIndex].name}
                  className="max-w-full max-h-full object-contain rounded drop-shadow-2xl"
                />
              ) : (
                 <ImageIcon className="w-16 h-16 text-white/20 animate-pulse" />
              )}
            </div>

            {/* Right Arrow */}
            {viewerIndex < snapshots.length - 1 && (
              <button 
                onClick={() => setViewerIndex(viewerIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-50 transform hover:scale-105"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Bottom Text Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none flex flex-col items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity z-40">
               <span className="text-white text-[13px] font-medium drop-shadow-md truncate max-w-[80%]">{snapshots[viewerIndex].name}</span>
               <span className="text-white/60 text-[10px] tracking-widest mt-0.5 uppercase drop-shadow-md">Snapshot {viewerIndex + 1} of {snapshots.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="h-8"></div>
    </PanelContainer>
  );
};
