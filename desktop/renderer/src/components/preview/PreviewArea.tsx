import { useEffect, useRef, useState } from 'react';
import { useScenes } from '../../context/SceneContext';

import { getPdfPageAsCanvas } from '../../services/pdfService';

interface Props {
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
}

// The canvas will now dynamically resize to its physical container dimensions

export const PreviewArea = ({ selectedSourceId, onSelectSource }: Props) => {
  const { activeScene, dispatch } = useScenes();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cache for the latest hardware frames and loaded static images
  const frameCache = useRef<Record<string, ImageBitmap | HTMLImageElement | HTMLCanvasElement>>({});
  
  // Track currently active IPC streams to avoid duplicate starts/stops
  const activeStreams = useRef<Set<string>>(new Set());

  // Interaction State
  // Interaction State
  const [interactionMode, setInteractionMode] = useState<string | null>(null);
  const [cursorStyle, setCursorStyle] = useState('default');
  const dragStart = useRef({ x: 0, y: 0, sourceX: 0, sourceY: 0, sourceWidth: 0, sourceHeight: 0 });

  // 1. Manage Capture Streams based on active scene
  useEffect(() => {
    if (!activeScene) return;

    const neededStreams = new Set<string>();
    
    // Start needed streams and load images
    activeScene.sources.forEach(source => {
      if (source.type === 'camera') {
        neededStreams.add(source.id);
        if (!activeStreams.current.has(source.id)) {
          activeStreams.current.add(source.id);
          window.electronAPI.startCamera(source.deviceId, source.id).catch(console.error);
          
          window.electronAPI.onVideoFrame(source.id, async (buffer, width, height) => {
            // BGRA -> RGBA Fast Swap
            const rgba = new Uint8ClampedArray(buffer.length);
            const source32 = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
            const dest32 = new Uint32Array(rgba.buffer);
            for (let i = 0; i < source32.length; i++) {
              const p = source32[i];
              dest32[i] = (p & 0xFF00FF00) | ((p & 0x00FF0000) >> 16) | ((p & 0x000000FF) << 16);
            }
            const imgData = new ImageData(rgba, width, height);
            const bmp = await createImageBitmap(imgData);
            frameCache.current[source.id] = bmp;
          });
        }
      } else if (source.type === 'screen') {
        neededStreams.add(source.id);
        if (!activeStreams.current.has(source.id)) {
          activeStreams.current.add(source.id);
          window.electronAPI.startScreen(source.displayId, source.id).catch(console.error);
          
          window.electronAPI.onVideoFrame(source.id, async (buffer, width, height) => {
            const rgba = new Uint8ClampedArray(buffer.length);
            const source32 = new Uint32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
            const dest32 = new Uint32Array(rgba.buffer);
            for (let i = 0; i < source32.length; i++) {
              const p = source32[i];
              dest32[i] = (p & 0xFF00FF00) | ((p & 0x00FF0000) >> 16) | ((p & 0x000000FF) << 16);
            }
            const imgData = new ImageData(rgba, width, height);
            const bmp = await createImageBitmap(imgData);
            frameCache.current[source.id] = bmp;
          });
        }
      } else if (source.type === 'image') {
        neededStreams.add(source.id);
        if (!frameCache.current[source.id]) {
          window.electronAPI.readImageFile(source.filePath!).then(dataUrl => {
            if (dataUrl) {
              const img = new Image();
              img.onload = () => { frameCache.current[source.id] = img; };
              img.src = dataUrl;
            }
          });
        }
      } else if (source.type === 'pdf') {
        neededStreams.add(source.id);
        const cacheKey = `${source.id}_${source.currentPage || 1}`;
        if (!frameCache.current[cacheKey] && source.file) {
          // Set a temporary flag to prevent multiple reads
          frameCache.current[cacheKey] = document.createElement('canvas');
          
          window.electronAPI.readDocumentFile(source.file).then(base64Data => {
            if (base64Data) {
              getPdfPageAsCanvas(base64Data, source.currentPage || 1).then(result => {
                if (result) {
                  frameCache.current[cacheKey] = result.canvas;
                  if (source.totalPages !== result.totalPages) {
                    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { totalPages: result.totalPages } } });
                  }
                } else {
                  delete frameCache.current[cacheKey];
                }
              });
            } else {
               delete frameCache.current[cacheKey];
            }
          });
        }
      }
    });

    // Cleanup unused streams
    activeStreams.current.forEach(sourceId => {
      if (!neededStreams.has(sourceId)) {
        window.electronAPI.removeVideoFrameListener(sourceId);
        window.electronAPI.stopCamera(sourceId).catch(() => {});
        window.electronAPI.stopScreen(sourceId).catch(() => {});
        activeStreams.current.delete(sourceId);
        delete frameCache.current[sourceId];
      }
    });

  }, [activeScene?.id, activeScene?.sources]); // Re-evaluate when sources change

  // Sync Layout to Native Engine for Recording
  useEffect(() => {
    if (activeScene) {
      window.electronAPI.updateRecordingLayout(JSON.stringify(activeScene));
    }
  }, [activeScene]);

  // 2. Compositor Loop
  useEffect(() => {
    let animationId: number;
    
    const render = () => {
      if (!canvasRef.current || !activeScene) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const physicalWidth = rect.width;
      const physicalHeight = rect.height;

      if (canvas.width !== physicalWidth) canvas.width = physicalWidth;
      if (canvas.height !== physicalHeight) canvas.height = physicalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();

      // Draw the dynamic recording background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, physicalWidth, physicalHeight);

      // --- Phase 1: Draw clipped sources ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, physicalWidth, physicalHeight);
      ctx.clip();

      const sortedSources = [...activeScene.sources].sort((a, b) => a.zIndex - b.zIndex);

      sortedSources.forEach(source => {
        if (!source.visible) return;

        ctx.save();
        
        const cx = source.transform.x + source.transform.width / 2;
        const cy = source.transform.y + source.transform.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(source.transform.rotation * Math.PI / 180);
        ctx.translate(-cx, -cy);

        ctx.globalAlpha = source.opacity;

        const x = source.transform.x;
        const y = source.transform.y;
        const w = source.transform.width;
        const h = source.transform.height;

        if (source.type === 'camera' || source.type === 'screen' || source.type === 'image' || source.type === 'pdf') {
          const cacheKey = source.type === 'pdf' ? `${source.id}_${source.currentPage || 1}` : source.id;
          const frame = frameCache.current[cacheKey];
          if (frame && (frame as HTMLCanvasElement).width > 0) {
            const sx = source.crop.left;
            const sy = source.crop.top;
            const sw = (frame as any).naturalWidth ? (frame as HTMLImageElement).naturalWidth - source.crop.left - source.crop.right : frame.width - source.crop.left - source.crop.right;
            const sh = (frame as any).naturalHeight ? (frame as HTMLImageElement).naturalHeight - source.crop.top - source.crop.bottom : frame.height - source.crop.top - source.crop.bottom;
            
            if (sw > 0 && sh > 0) {
              ctx.drawImage(frame, sx, sy, sw, sh, x, y, w, h);
            }
          } else {
            ctx.fillStyle = '#222';
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#555';
            ctx.font = '24px Arial';
            ctx.fillText('Loading...', x + 20, y + 40);
          }
        } 
        else if (source.type === 'text') {
          ctx.fillStyle = source.color;
          ctx.font = `${source.fontWeight} ${source.fontSize}px ${source.fontFamily}`;
          ctx.textBaseline = 'top';
          ctx.fillText(source.text, x, y);
        }

        if (selectedSourceId === source.id) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          
          ctx.fillStyle = '#ffffff';
          const handleSize = 6;
          const half = handleSize / 2;
          const handles = [
            [x, y], [x + w/2, y], [x + w, y],
            [x, y + h/2], [x + w, y + h/2],
            [x, y + h], [x + w/2, y + h], [x + w, y + h]
          ];
          handles.forEach(([hx, hy]) => {
            ctx.fillRect(hx - half, hy - half, handleSize, handleSize);
            ctx.strokeRect(hx - half, hy - half, handleSize, handleSize);
          });
        }

        ctx.restore();
      });

      ctx.restore(); // End clipping

      ctx.restore(); // Restore root transform

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [activeScene, selectedSourceId]);

  // 3. Mouse Interactions (Drag & Resize)
  const getLogicalMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!activeScene) return;
    const { x, y } = getLogicalMousePos(e);

    if (selectedSourceId) {
      const selectedSource = activeScene.sources.find(s => s.id === selectedSourceId);
      if (selectedSource && !selectedSource.locked && selectedSource.visible) {
        const sx = selectedSource.transform.x;
        const sy = selectedSource.transform.y;
        const sw = selectedSource.transform.width;
        const sh = selectedSource.transform.height;
        const handleSize = 12; 
        
        const handles = [
          { mode: 'resize-nw', hx: sx, hy: sy },
          { mode: 'resize-n', hx: sx + sw/2, hy: sy },
          { mode: 'resize-ne', hx: sx + sw, hy: sy },
          { mode: 'resize-w', hx: sx, hy: sy + sh/2 },
          { mode: 'resize-e', hx: sx + sw, hy: sy + sh/2 },
          { mode: 'resize-sw', hx: sx, hy: sy + sh },
          { mode: 'resize-s', hx: sx + sw/2, hy: sy + sh },
          { mode: 'resize-se', hx: sx + sw, hy: sy + sh }
        ];

        const clickedHandle = handles.find(h => 
          x >= h.hx - handleSize && x <= h.hx + handleSize &&
          y >= h.hy - handleSize && y <= h.hy + handleSize
        );

        if (clickedHandle) {
          setInteractionMode(clickedHandle.mode);
          dragStart.current = { x, y, sourceX: sx, sourceY: sy, sourceWidth: sw, sourceHeight: sh };
          return;
        }
      }
    }

    const sortedSources = [...activeScene.sources].sort((a, b) => b.zIndex - a.zIndex);
    const clicked = sortedSources.find(s => 
      s.visible && 
      x >= s.transform.x && x <= s.transform.x + s.transform.width &&
      y >= s.transform.y && y <= s.transform.y + s.transform.height
    );

    if (clicked) {
      onSelectSource(clicked.id);
      if (!clicked.locked) {
        setInteractionMode('move');
        dragStart.current = { x, y, sourceX: clicked.transform.x, sourceY: clicked.transform.y, sourceWidth: clicked.transform.width, sourceHeight: clicked.transform.height };
      }
    } else {
      onSelectSource(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getLogicalMousePos(e);

    // 1. Hover Logic (When not dragging)
    if (!interactionMode) {
      let newCursor = 'default';
      
      if (activeScene && selectedSourceId) {
        const selectedSource = activeScene.sources.find(s => s.id === selectedSourceId);
        if (selectedSource && !selectedSource.locked && selectedSource.visible) {
          const sx = selectedSource.transform.x;
          const sy = selectedSource.transform.y;
          const sw = selectedSource.transform.width;
          const sh = selectedSource.transform.height;
          const handleSize = 12; 
          
          const handles = [
            { mode: 'nwse-resize', hx: sx, hy: sy },
            { mode: 'ns-resize', hx: sx + sw/2, hy: sy },
            { mode: 'nesw-resize', hx: sx + sw, hy: sy },
            { mode: 'ew-resize', hx: sx, hy: sy + sh/2 },
            { mode: 'ew-resize', hx: sx + sw, hy: sy + sh/2 },
            { mode: 'nesw-resize', hx: sx, hy: sy + sh },
            { mode: 'ns-resize', hx: sx + sw/2, hy: sy + sh },
            { mode: 'nwse-resize', hx: sx + sw, hy: sy + sh }
          ];

          const hoveredHandle = handles.find(h => 
            x >= h.hx - handleSize && x <= h.hx + handleSize &&
            y >= h.hy - handleSize && y <= h.hy + handleSize
          );

          if (hoveredHandle) {
            newCursor = hoveredHandle.mode;
          } else if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
            newCursor = 'move';
          }
        }
      }
      
      if (cursorStyle !== newCursor) {
        setCursorStyle(newCursor);
      }
      return;
    }

    // 2. Drag Logic
    if (!activeScene || !selectedSourceId) return;
    
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;

    const source = activeScene.sources.find(s => s.id === selectedSourceId);
    if (!source || source.locked) return;

    let newX = dragStart.current.sourceX;
    let newY = dragStart.current.sourceY;
    let newWidth = dragStart.current.sourceWidth;
    let newHeight = dragStart.current.sourceHeight;

    if (interactionMode === 'move') {
      newX += dx;
      newY += dy;
    } else {
      const dir = interactionMode.split('-')[1] || '';
      
      if (dir.includes('w')) {
        newX += dx;
        newWidth -= dx;
      }
      if (dir.includes('e')) {
        newWidth += dx;
      }
      if (dir.includes('n')) {
        newY += dy;
        newHeight -= dy;
      }
      if (dir.includes('s')) {
        newHeight += dy;
      }

      if (newWidth < 10) {
        if (dir.includes('w')) newX -= (10 - newWidth);
        newWidth = 10;
      }
      if (newHeight < 10) {
        if (dir.includes('n')) newY -= (10 - newHeight);
        newHeight = 10;
      }
    }

    dispatch({
      type: 'UPDATE_SOURCE',
      payload: {
        sceneId: activeScene.id,
        sourceId: selectedSourceId,
        updates: {
          transform: {
            ...source.transform,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          }
        }
      }
    });
  };

  const handleMouseUp = () => {
    setInteractionMode(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!activeScene) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const sortedSources = [...activeScene.sources].sort((a, b) => b.zIndex - a.zIndex);
    
    for (const source of sortedSources) {
      if (!source.visible || source.locked) continue;
      
      const sX = source.transform.x;
      const sY = source.transform.y;
      const sW = source.transform.width;
      const sH = source.transform.height;

      if (x >= sX && x <= sX + sW && y >= sY && y <= sY + sH) {
        const cacheKey = source.type === 'pdf' ? `${source.id}_${source.currentPage || 1}` : source.id;
        const frame = frameCache.current[cacheKey];
        if (frame) {
          const frameW = (frame as any).naturalWidth || frame.width;
          const frameH = (frame as any).naturalHeight || frame.height;
          if (frameW && frameH) {
            const ar = frameW / frameH;
            let targetW = rect.width;
            let targetH = rect.height;
            if (rect.width / rect.height > ar) {
              targetW = rect.height * ar;
            } else {
              targetH = rect.width / ar;
            }
            
            dispatch({
              type: 'UPDATE_SOURCE',
              payload: {
                sceneId: activeScene.id,
                sourceId: source.id,
                updates: {
                  transform: {
                    ...source.transform,
                    x: (rect.width - targetW) / 2,
                    y: (rect.height - targetH) / 2,
                    width: targetW,
                    height: targetH
                  }
                }
              }
            });
            break;
          }
        }
      }
    }
  };

  const selectedSource = activeScene?.sources.find(s => s.id === selectedSourceId);

  return (
    <div 
      className="flex-1 bg-black relative overflow-hidden"
      style={{ cursor: cursorStyle }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        id="main-preview-canvas"
        ref={canvasRef}
        className="w-full h-full object-contain"
        onContextMenu={(e) => {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-source-menu', { detail: { x: e.clientX, y: e.clientY } }));
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* PDF Floating Overlay */}
      {selectedSource && selectedSource.type === 'pdf' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-[#2c313a]/90 text-white px-3 py-1.5 rounded shadow-lg backdrop-blur text-sm select-none border border-[#4b5563]">
          <button 
            disabled={!selectedSource.currentPage || selectedSource.currentPage <= 1}
            onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene!.id, sourceId: selectedSource.id, updates: { currentPage: (selectedSource.currentPage || 1) - 1 } } })}
            className="p-1 hover:text-[#00B4FF] disabled:opacity-50 disabled:hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /><path fillRule="evenodd" d="M8 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
          </button>
          
          <span className="mx-4 font-medium font-mono tracking-wider">
            {selectedSource.currentPage || 1} / {selectedSource.totalPages || 1}
          </span>
          
          <button 
            disabled={!selectedSource.totalPages || (selectedSource.currentPage || 1) >= selectedSource.totalPages}
            onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene!.id, sourceId: selectedSource.id, updates: { currentPage: (selectedSource.currentPage || 1) + 1 } } })}
            className="p-1 hover:text-[#00B4FF] disabled:opacity-50 disabled:hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /><path fillRule="evenodd" d="M12 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}
      
      {/* Helper overlay when no scene */}
      {!activeScene && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/50 font-medium tracking-wide">Create or select a preset to begin</span>
        </div>
      )}
    </div>
  );
};
