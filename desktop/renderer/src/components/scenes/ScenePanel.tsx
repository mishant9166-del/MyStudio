import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronRight, ChevronLeft, Layers, Trash2, Camera, Monitor, FileText, Image as ImageIcon } from 'lucide-react';
import { useScenes } from '../../context/SceneContext';
import type { Scene } from '../../../../shared/types';
import { getPdfPageAsCanvas } from '../../services/pdfService';

const LiveThumbnail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      const sourceCanvas = document.getElementById('main-preview-canvas') as HTMLCanvasElement;
      const targetCanvas = canvasRef.current;
      
      if (sourceCanvas && targetCanvas) {
        const ctx = targetCanvas.getContext('2d');
        if (ctx && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
          targetCanvas.width = 160;
          targetCanvas.height = 90;
          ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
        }
      }
      animationId = requestAnimationFrame(loop);
    };
    loop();
    
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-100"
    />
  );
};

const StaticThumbnail = ({ scene }: { scene: Scene }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scene.sources.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 90;
    
    // Clear background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 160, 90);

    const scale = 160 / 1920;
    const sortedSources = [...scene.sources].sort((a, b) => a.zIndex - b.zIndex);

    const loadPromises = sortedSources.map(async (source) => {
      let drawable: HTMLCanvasElement | HTMLImageElement | null = null;
      
      try {
        if (source.type === 'pdf' && source.file) {
          const base64Data = await window.electronAPI.readDocumentFile(source.file);
          if (base64Data) {
            const result = await getPdfPageAsCanvas(source.id, base64Data, source.currentPage || 1);
            if (result && result.canvas) drawable = result.canvas;
          }
        } else if (source.type === 'image' && source.filePath) {
          const dataUrl = await window.electronAPI.readImageFile(source.filePath);
          if (dataUrl) {
            await new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => { drawable = img; resolve(); };
              img.onerror = () => resolve();
              img.src = dataUrl;
            });
          }
        }
      } catch (err) {
        console.error("Error loading source for thumbnail:", err);
      }
      
      return { source, drawable };
    });

    Promise.all(loadPromises).then((results) => {
      results.forEach(({ source, drawable }) => {
        if (!source.visible) return;
        
        ctx.save();
        
        // Handle transforms exactly like PreviewArea
        const cx = (source.transform.x + source.transform.width / 2) * scale;
        const cy = (source.transform.y + source.transform.height / 2) * scale;
        ctx.translate(cx, cy);
        ctx.rotate(source.transform.rotation * Math.PI / 180);
        ctx.translate(-cx, -cy);

        ctx.globalAlpha = source.opacity;

        const x = source.transform.x * scale;
        const y = source.transform.y * scale;
        const w = source.transform.width * scale;
        const h = source.transform.height * scale;

        if (drawable) {
          // Note: cropping is ignored for static thumbnails for simplicity
          ctx.drawImage(drawable, x, y, w, h);
        } else if (source.type === 'camera' || source.type === 'screen') {
          // Draw dark placeholder for devices
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = '#334155'; // slate-700
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        } else if (source.type === 'text') {
          ctx.fillStyle = source.color;
          ctx.font = `${Math.max(4, source.fontSize * scale)}px ${source.fontFamily}`;
          ctx.textBaseline = 'top';
          ctx.fillText(source.text, x, y);
        }

        ctx.restore();
      });
    });

  }, [scene.sources]);


  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-100" />;
};

export const ScenePanel = () => {
  const { state, dispatch, activeScene } = useScenes();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [state.scenes.length]);

  const handleAddScene = () => {
    dispatch({ type: 'ADD_SCENE', payload: { name: `Preset ${state.scenes.length + 1}` } });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.scenes.length <= 1) {
      alert("Cannot delete the last preset.");
      return;
    }
    if (confirm("Are you sure you want to delete this preset?")) {
      dispatch({ type: 'DELETE_SCENE', payload: { id } });
    }
  };

  const handleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_SCENE', payload: { id } });
  };

  return (
    <div className="w-full h-[104px] bg-[#eef3f7] flex items-center relative border-t border-slate-200">
      
      {/* Left Scroll Arrow */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-start pl-2 pointer-events-none z-20">
          <button 
            className="w-8 h-8 rounded-full bg-slate-300/50 hover:bg-slate-300 flex items-center justify-center text-white pointer-events-auto transition-colors backdrop-blur-sm"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: -160, behavior: 'smooth' });
                setTimeout(checkScroll, 350); // Re-check after smooth scroll
              }
            }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      )}
      
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 flex items-center space-x-2 overflow-x-auto h-full px-1 scrollbar-none"
      >
        
        {/* Dynamic Scene Presets */}
        {state.scenes.map((scene, index) => {
          const isActive = activeScene?.id === scene.id;
          
          return (
            <div 
              key={scene.id}
              onClick={(e) => handleSelect(scene.id, e)}
              className={`group shrink-0 h-[90px] w-40 rounded cursor-pointer relative overflow-hidden flex flex-col items-center justify-center transition-all ${
                isActive ? 'bg-zinc-900 border-2 border-[#00B4FF]' : 'bg-white border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Dynamic Thumbnail representation based on sources */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                {isActive ? (
                  <LiveThumbnail />
                ) : (
                  <StaticThumbnail scene={scene} />
                )}
              </div>
              
              {/* Hover Delete Action */}
              {state.scenes.length > 1 && (
                <button 
                  onClick={(e) => handleDelete(scene.id, e)}
                  className="absolute bottom-1.5 right-1.5 hidden group-hover:flex items-center justify-center bg-black/50 hover:bg-red-500 rounded p-1 transition-colors z-20 shadow-sm"
                  title="Delete Preset"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              )}

              {/* Number Badge */}
              <div className={`absolute top-0 right-0 text-[10px] font-bold px-1.5 rounded-bl z-20 ${isActive ? 'bg-[#00B4FF] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {index + 1}
              </div>
            </div>
          );
        })}

        {/* Add Preset Button */}
        <div 
          onClick={handleAddScene}
          className="group shrink-0 h-[90px] w-40 rounded cursor-pointer relative overflow-hidden bg-white/50 border-2 border-dashed border-slate-300 hover:border-[#00B4FF] hover:bg-white flex items-center justify-center transition-colors"
        >
          <Plus className="w-8 h-8 text-slate-400 group-hover:text-[#00B4FF] transition-colors" />
        </div>

      </div>

      {/* Right Scroll Arrow */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 h-full w-12 flex items-center justify-end pr-2 pointer-events-none z-20">
          <button 
            className="w-8 h-8 rounded-full bg-slate-300/50 hover:bg-slate-300 flex items-center justify-center text-white pointer-events-auto transition-colors backdrop-blur-sm"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
                setTimeout(checkScroll, 350); // Re-check after smooth scroll
              }
            }}
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      )}

    </div>
  );
};
