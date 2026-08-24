import { useEffect, useRef, useState } from 'react';
import { useScenes } from '../../context/SceneContext';

import { getPdfPageAsCanvas, hasPdfCached } from '../../services/pdfService';

interface Props {
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
}

// The canvas will now dynamically resize to its physical container dimensions

export const PreviewArea = ({ selectedSourceId, onSelectSource }: Props) => {
  const { activeScene, dispatch } = useScenes();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Cache for the latest hardware frames and loaded static images
  const frameCache = useRef<Record<string, ImageBitmap | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement>>({});
  
  // Track currently active IPC streams to avoid duplicate starts/stops
  const activeStreams = useRef<Set<string>>(new Set());

  // Interaction State
  // Interaction State
  const [interactionMode, setInteractionMode] = useState<string | null>(null);
  const [cursorStyle, setCursorStyle] = useState('default');
  const [isPdfHovered, setIsPdfHovered] = useState(false);
  const [playingSources, setPlayingSources] = useState<Set<string>>(new Set());
  const [canvasLayout, setCanvasLayout] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const dragStart = useRef({ x: 0, y: 0, sourceX: 0, sourceY: 0, sourceWidth: 0, sourceHeight: 0 });

  // Track canvas layout for overlay positioning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const physicalWidth = rect.width;
      const physicalHeight = rect.height;
      const scaleX = physicalWidth / 1920;
      const scaleY = physicalHeight / 1080;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (physicalWidth - 1920 * scale) / 2;
      const offsetY = (physicalHeight - 1080 * scale) / 2;
      setCanvasLayout({ scale, offsetX, offsetY });
    });
    observer.observe(canvas);
    
    // Prevent default browser zoom on pinch
    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    
    return () => {
      observer.disconnect();
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Auto-advance playing sources
  useEffect(() => {
    if (playingSources.size === 0 || !activeScene) return;
    
    const interval = setInterval(() => {
      playingSources.forEach(sourceId => {
        const source = activeScene.sources.find(s => s.id === sourceId);
        if (!source) return;
        
        if (source.type === 'pdf') {
          if (source.currentPage && source.totalPages && source.currentPage < source.totalPages) {
            dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId, updates: { currentPage: source.currentPage + 1, scrollOffset: 0 } } });
          } else if (source.currentPage === source.totalPages) {
            setPlayingSources(prev => { const n = new Set(prev); n.delete(sourceId); return n; });
          }
        } else if (source.type === 'powerpoint') {
          window.electronAPI.nextPowerPointSlide(sourceId);
        }
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [playingSources, activeScene, dispatch]);

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
      } else if (source.type === 'powerpoint') {
        neededStreams.add(source.id);
        if (!activeStreams.current.has(source.id)) {
          activeStreams.current.add(source.id);
          window.electronAPI.startPowerPoint(source.id, source.file!).then((windowId: string | null) => {
            if (windowId) {
              navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  cursor: 'never',
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: windowId,
                    minWidth: 1280, maxWidth: 1920,
                    minHeight: 720, maxHeight: 1080
                  }
                } as any
              }).then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;
                video.play();
                frameCache.current[source.id] = video;
              }).catch(console.error);
            }
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
        const zoom = source.zoom || 1;
        const visiblePagesCount = Math.max(2, Math.ceil(1 / zoom) + 1);
        const pagesToLoad: number[] = [];
        const startPage = source.currentPage || 1;
        
        for (let i = -1; i <= visiblePagesCount; i++) {
          const p = startPage + i;
          if (p >= 1 && p <= (source.totalPages || 1)) {
            pagesToLoad.push(p);
          }
        }
        
        pagesToLoad.forEach(pageNum => {
          const cacheKey = `${source.id}_${pageNum}`;
          if (!frameCache.current[cacheKey] && source.file) {
            frameCache.current[cacheKey] = document.createElement('canvas'); // Set temporary flag
            
            const loadPage = (base64Data: string) => {
              getPdfPageAsCanvas(source.id, base64Data, pageNum).then(result => {
                if (result) {
                  frameCache.current[cacheKey] = result.canvas;
                  if (source.totalPages !== result.totalPages) {
                    dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene.id, sourceId: source.id, updates: { totalPages: result.totalPages } } });
                  }
                } else {
                  delete frameCache.current[cacheKey];
                }
              });
            };

            if (hasPdfCached(source.id)) {
              loadPage(""); // Empty string is ignored by getPdfPageAsCanvas if already cached
            } else {
              window.electronAPI.readDocumentFile(source.file).then(base64Data => {
                if (base64Data) loadPage(base64Data);
                else delete frameCache.current[cacheKey];
              });
            }
          }
        });
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

      // --- Coordinate Space Setup (1920x1080) ---
      const scaleX = physicalWidth / 1920;
      const scaleY = physicalHeight / 1080;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (physicalWidth - 1920 * scale) / 2;
      const offsetY = (physicalHeight - 1080 * scale) / 2;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Draw the virtual 1920x1080 bounding box background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1920, 1080);

      // --- Phase 1: Draw clipped sources ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 1920, 1080);
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

        if (source.type === 'camera' || source.type === 'screen' || source.type === 'image' || source.type === 'pdf' || source.type === 'powerpoint') {
          if (source.type === 'pdf') {
            ctx.fillStyle = '#454b51'; 
            ctx.fillRect(x, y, w, h);
          }

          const cacheKey = source.type === 'pdf' ? `${source.id}_${source.currentPage || 1}` : source.id;
          const frame = frameCache.current[cacheKey];
          const hasFrame = frame && (
            (frame as HTMLCanvasElement).width > 0 || 
            (frame as HTMLVideoElement).videoWidth > 0 ||
            (frame as ImageBitmap).width > 0
          );

          if (hasFrame) {
            const fw = (frame as any).videoWidth || (frame as any).naturalWidth || (frame as any).width || 0;
            const fh = (frame as any).videoHeight || (frame as any).naturalHeight || (frame as any).height || 0;
            
            if (source.type === 'pdf') {
              if (fw > 0 && fh > 0) {
                const currentPageNum = source.currentPage || 1;
                const scrollOffset = source.scrollOffset || 0;
                const gap = 20;
                const zoom = source.zoom || 1;
                
                const drawPdfPage = (pgFrame: any, yOffset: number) => {
                  if (!pgFrame) return h * zoom;
                  const pfw = pgFrame.width || 0;
                  const pfh = pgFrame.height || 0;
                  if (pfw > 0 && pfh > 0) {
                    const pdfAr = pfw / pfh;
                    // Fit to height so it matches ManyCam aspect ratio perfectly, scaled by zoom
                    const drawH = h * zoom;
                    const drawW = h * pdfAr * zoom;
                    const offsetX = (w - drawW) / 2;
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.clip();
                    ctx.drawImage(pgFrame, 0, 0, pfw, pfh, x + offsetX, y + yOffset, drawW, drawH);
                    ctx.restore();
                    return drawH;
                  }
                  return h * zoom;
                };

                const visiblePagesCount = Math.max(2, Math.ceil(1 / zoom) + 1);
                const totalPagesCount = source.totalPages || 1;
                
                // If the ENTIRE document fits in the container, center it vertically
                const totalDocHeight = totalPagesCount * (h * zoom) + (totalPagesCount - 1) * gap;
                let currentYOffset = -scrollOffset;
                
                if (totalDocHeight <= h) {
                  currentYOffset = (h - totalDocHeight) / 2;
                }
                
                for (let i = 0; i < visiblePagesCount; i++) {
                  const pNum = currentPageNum + i;
                  if (pNum > totalPagesCount) break;
                  
                  const pFrame = frameCache.current[`${source.id}_${pNum}`] || (i === 0 ? frame : null);
                  const pageH = drawPdfPage(pFrame, currentYOffset);
                  currentYOffset += pageH + gap;
                }

                // Draw Scrollbar
                const totalPages = source.totalPages || 1;
                if (totalPages > 1 || zoom > 1) {
                  const PAGE_H = h * zoom + gap;
                  const maxLastPageOffset = Math.max(0, h * zoom - h);
                  const maxAbsoluteScrollY = (totalPages - 1) * PAGE_H + maxLastPageOffset;
                  
                  if (maxAbsoluteScrollY > 0) {
                    const absoluteScrollY = (currentPageNum - 1) * PAGE_H + scrollOffset;
                    const scrollPercent = Math.min(1, Math.max(0, absoluteScrollY / maxAbsoluteScrollY));
                    
                    const scrollbarWidth = 6;
                    const minThumbHeight = 20;
                    const thumbHeight = Math.max(minThumbHeight, (h / (totalPages * PAGE_H)) * h);
                    const maxThumbY = h - thumbHeight - 10;
                    const thumbY = 5 + scrollPercent * maxThumbY;
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.beginPath();
                    if (ctx.roundRect) {
                      ctx.roundRect(x + w - scrollbarWidth - 5, y + thumbY, scrollbarWidth, thumbHeight, scrollbarWidth / 2);
                    } else {
                      ctx.rect(x + w - scrollbarWidth - 5, y + thumbY, scrollbarWidth, thumbHeight);
                    }
                    ctx.fill();
                  }
                }
              }
            } else {
              const zoom = source.zoom || 1;
              const sx = source.crop.left;
              const sy = source.crop.top;
              const sw = fw - source.crop.left - source.crop.right;
              const sh = fh - source.crop.top - source.crop.bottom;
              
              if (sw > 0 && sh > 0) {
                if (zoom !== 1) {
                  const drawW = w * zoom;
                  const drawH = h * zoom;
                  const offsetX = (w - drawW) / 2;
                  const offsetY = (h - drawH) / 2;
                  
                  ctx.save();
                  ctx.beginPath();
                  ctx.rect(x, y, w, h);
                  ctx.clip();
                  ctx.drawImage(frame, sx, sy, sw, sh, x + offsetX, y + offsetY, drawW, drawH);
                  ctx.restore();
                } else {
                  ctx.drawImage(frame, sx, sy, sw, sh, x, y, w, h);
                }
              }
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

        ctx.restore();
      });

      ctx.restore(); // End clipping

      // Phase 2: Draw UI Overlays (Handles)
      if (selectedSourceId) {
        const selectedSource = activeScene.sources.find(s => s.id === selectedSourceId);
        if (selectedSource && selectedSource.visible && !selectedSource.locked) {
          ctx.save();
          
          const cx = selectedSource.transform.x + selectedSource.transform.width / 2;
          const cy = selectedSource.transform.y + selectedSource.transform.height / 2;
          ctx.translate(cx, cy);
          ctx.rotate(selectedSource.transform.rotation * Math.PI / 180);
          ctx.translate(-cx, -cy);

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2 / scale;
          
          const x = selectedSource.transform.x;
          const y = selectedSource.transform.y;
          const w = selectedSource.transform.width;
          const h = selectedSource.transform.height;
          
          ctx.strokeRect(x, y, w, h);
          
          ctx.fillStyle = '#ffffff';
          const handleSize = 8 / scale;
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
          
          ctx.restore();
        }
      }

      ctx.restore(); // Restore root transform

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [activeScene, selectedSourceId]);

  // 3. Mouse Interactions (Drag & Resize)
  const getLogicalMousePos = (e: React.MouseEvent | React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const physicalWidth = rect.width;
    const physicalHeight = rect.height;
    
    const scaleX = physicalWidth / 1920;
    const scaleY = physicalHeight / 1080;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (physicalWidth - 1920 * scale) / 2;
    const offsetY = (physicalHeight - 1080 * scale) / 2;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    return {
      x: (rawX - offsetX) / scale,
      y: (rawY - offsetY) / scale
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
      let hoveringPdf = false;
      
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
            if (selectedSource.type === 'pdf' || selectedSource.type === 'powerpoint') hoveringPdf = true;
          } else if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
            newCursor = (selectedSource.type === 'pdf' || selectedSource.type === 'powerpoint') ? 'default' : 'move';
            if (selectedSource.type === 'pdf' || selectedSource.type === 'powerpoint') hoveringPdf = true;
          }
        }
      }
      
      if (cursorStyle !== newCursor) {
        setCursorStyle(newCursor);
      }
      if (isPdfHovered !== hoveringPdf) {
        setIsPdfHovered(hoveringPdf);
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
      
      // Clamp movement bounds
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX + newWidth > 1920) newX = 1920 - newWidth;
      if (newY + newHeight > 1080) newY = 1080 - newHeight;
    } else {
      const dir = interactionMode.split('-')[1] || '';
      
      if (dir.includes('w')) {
        newX += dx;
        newWidth -= dx;
        if (newX < 0) {
          newWidth += newX; // Reduce width by the overflow
          newX = 0;
        }
      }
      if (dir.includes('e')) {
        newWidth += dx;
        if (newX + newWidth > 1920) {
          newWidth = 1920 - newX;
        }
      }
      if (dir.includes('n')) {
        newY += dy;
        newHeight -= dy;
        if (newY < 0) {
          newHeight += newY; // Reduce height by the overflow
          newY = 0;
        }
      }
      if (dir.includes('s')) {
        newHeight += dy;
        if (newY + newHeight > 1080) {
          newHeight = 1080 - newY;
        }
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

  const handleMouseLeave = () => {
    setInteractionMode(null);
    setIsPdfHovered(false);
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
            let targetW = 1920;
            let targetH = 1080;
            if (1920 / 1080 > ar) {
              targetW = 1080 * ar;
            } else {
              targetH = 1920 / ar;
            }
            
            dispatch({
              type: 'UPDATE_SOURCE',
              payload: {
                sceneId: activeScene.id,
                sourceId: source.id,
                updates: {
                  transform: {
                    ...source.transform,
                    x: (1920 - targetW) / 2,
                    y: (1080 - targetH) / 2,
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

  const handleWheel = (e: React.WheelEvent) => {
    if (!activeScene || !selectedSourceId) return;
    const selectedSource = activeScene.sources.find(s => s.id === selectedSourceId);
    if (!selectedSource || selectedSource.locked || !selectedSource.visible) return;

    // Handle trackpad pinch-to-zoom or Ctrl+Scroll for all sources
    if (e.ctrlKey) {
      // Scale deltaY for smooth trackpad pinch, but cap it to prevent massive jumps from physical mouse wheels
      const rawDelta = e.deltaY * -0.005; 
      const zoomDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 0.15);
      
      let newZoom = (selectedSource.zoom || (selectedSource.type === 'pdf' ? 1.5 : 1)) + zoomDelta;
      newZoom = Math.min(3, Math.max(0.1, newZoom));
      
      dispatch({
        type: 'UPDATE_SOURCE',
        payload: {
          sceneId: activeScene.id,
          sourceId: selectedSource.id,
          updates: { zoom: newZoom }
        }
      });
      return;
    }

    // Only PDFs support vertical document scrolling
    if (selectedSource.type !== 'pdf') return;

    // Use the actual deltaY for smooth trackpad and mouse scrolling
    let newOffset = (selectedSource.scrollOffset || 0) + e.deltaY;
    let newPage = selectedSource.currentPage || 1;
    
    // We use the source's transform height scaled by zoom as the page height for scroll math, plus a 20px gap
    const zoom = selectedSource.zoom || 1;
    const PAGE_HEIGHT = selectedSource.transform.height * zoom + 20; 

    // Handle jumping multiple pages if scrolling very fast
    while (newOffset > PAGE_HEIGHT && newPage < (selectedSource.totalPages || 1)) {
      newPage += 1;
      newOffset -= PAGE_HEIGHT;
    }
    
    while (newOffset < 0 && newPage > 1) {
      newPage -= 1;
      newOffset += PAGE_HEIGHT;
    }
    
    // Clamp to start of first page
    if (newPage === 1 && newOffset < 0) {
      newOffset = 0;
    }
    
    // Prevent scrolling past the end of the last page
    const totalPagesCount = selectedSource.totalPages || 1;
    const totalDocHeight = totalPagesCount * (selectedSource.transform.height * zoom) + (totalPagesCount - 1) * 20;
    
    // If the entire document fits within the bounds, we shouldn't be able to scroll at all
    if (totalDocHeight <= selectedSource.transform.height) {
      newPage = 1;
      newOffset = 0;
    } else if (newPage === totalPagesCount) {
      const maxLastPageOffset = Math.max(0, selectedSource.transform.height * zoom - selectedSource.transform.height);
      if (newOffset > maxLastPageOffset) {
        newOffset = maxLastPageOffset;
      }
    }

    dispatch({ 
      type: 'UPDATE_SOURCE', 
      payload: { 
        sceneId: activeScene.id, 
        sourceId: selectedSource.id, 
        updates: { scrollOffset: newOffset, currentPage: newPage } 
      } 
    });
  };

  const selectedSource = activeScene?.sources.find(s => s.id === selectedSourceId);

  const togglePlay = (id: string) => {
    setPlayingSources(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div 
      className="flex-1 min-w-0 min-h-0 bg-transparent relative overflow-hidden flex items-center justify-center"
      style={{ cursor: cursorStyle }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
      {selectedSource && selectedSource.type === 'pdf' && isPdfHovered && (() => {
        const { scale, offsetX, offsetY } = canvasLayout;
        const cx = selectedSource.transform.x + selectedSource.transform.width / 2;
        const cy = selectedSource.transform.y + selectedSource.transform.height;
        const physicalX = cx * scale + offsetX;
        const physicalY = cy * scale + offsetY;
        
        return (
          <div 
            className="absolute flex items-center space-x-1.5 select-none z-10 -translate-x-1/2 -translate-y-[calc(100%+16px)]"
            style={{ left: physicalX, top: physicalY }}
            onMouseEnter={() => setIsPdfHovered(true)}
          >
            <button 
              disabled={!selectedSource.currentPage || selectedSource.currentPage <= 1}
              onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene!.id, sourceId: selectedSource.id, updates: { currentPage: (selectedSource.currentPage || 1) - 1, scrollOffset: 0 } } })}
              className="flex items-center justify-center w-8 h-8 bg-[#424953] text-[#d1d5db] rounded-md hover:bg-[#4a5159] disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2v12h2.5V2H4zm8 12L6.5 8 12 2v12z"/></svg>
            </button>
            
            <button 
              onClick={() => togglePlay(selectedSource.id)}
              className="flex items-center justify-center w-8 h-8 bg-[#424953] text-[#d1d5db] rounded-md hover:bg-[#4a5159] transition-colors"
              title={playingSources.has(selectedSource.id) ? "Pause Slideshow" : "Play Slideshow"}
            >
              {playingSources.has(selectedSource.id) ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2h2.5v12H4V2zm5.5 0H12v12H9.5V2z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2l9 6-9 6V2z"/></svg>
              )}
            </button>
            
            <button 
              disabled={!selectedSource.totalPages || (selectedSource.currentPage || 1) >= selectedSource.totalPages}
              onClick={() => dispatch({ type: 'UPDATE_SOURCE', payload: { sceneId: activeScene!.id, sourceId: selectedSource.id, updates: { currentPage: (selectedSource.currentPage || 1) + 1, scrollOffset: 0 } } })}
              className="flex items-center justify-center w-8 h-8 bg-[#424953] text-[#d1d5db] rounded-md hover:bg-[#4a5159] disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M12 2v12H9.5V2H12zM4 2l5.5 6L4 14V2z"/></svg>
            </button>

            <div className="flex items-center justify-center px-3 h-8 bg-[#424953] rounded-md text-[13px] font-semibold tracking-wide border-none shadow-sm">
              <span className="text-[#60bbf0]">{selectedSource.currentPage || 1}</span>
              <span className="text-white">/{selectedSource.totalPages || 1}</span>
            </div>
          </div>
        );
      })()}

      {/* PowerPoint Floating Overlay */}
      {selectedSource && selectedSource.type === 'powerpoint' && isPdfHovered && (() => {
        const { scale, offsetX, offsetY } = canvasLayout;
        const cx = selectedSource.transform.x + selectedSource.transform.width / 2;
        const cy = selectedSource.transform.y + selectedSource.transform.height;
        const physicalX = cx * scale + offsetX;
        const physicalY = cy * scale + offsetY;
        
        return (
          <div 
            className="absolute flex items-center space-x-1.5 select-none z-10 -translate-x-1/2 -translate-y-[calc(100%+16px)]"
            style={{ left: physicalX, top: physicalY }}
            onMouseEnter={() => setIsPdfHovered(true)}
          >
            <button 
              onClick={() => window.electronAPI.prevPowerPointSlide(selectedSource.id)}
              className="flex items-center justify-center w-8 h-8 bg-[#424953] text-[#d1d5db] rounded-md hover:bg-[#4a5159] transition-colors"
              title="Previous Slide"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2v12h2.5V2H4zm8 12L6.5 8 12 2v12z"/></svg>
            </button>
            
            <button 
              onClick={() => togglePlay(selectedSource.id)}
              className="flex items-center justify-center w-8 h-8 bg-[#424953] text-[#d1d5db] rounded-md hover:bg-[#4a5159] transition-colors"
              title={playingSources.has(selectedSource.id) ? "Pause Slideshow" : "Play Slideshow"}
            >
              {playingSources.has(selectedSource.id) ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2h2.5v12H4V2zm5.5 0H12v12H9.5V2z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2l9 6-9 6V2z"/></svg>
              )}
            </button>
            
            <button 
              onClick={() => window.electronAPI.nextPowerPointSlide(selectedSource.id)}
              className="flex items-center justify-center w-8 h-8 bg-[#424953] text-[#d1d5db] rounded-md hover:bg-[#4a5159] transition-colors"
              title="Next Slide"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M12 2v12H9.5V2H12zM4 2l5.5 6L4 14V2z"/></svg>
            </button>
            
            <div className="flex items-center justify-center px-3 h-8 bg-[#424953] rounded-md text-[13px] font-semibold tracking-wide border-none shadow-sm text-white">
              PowerPoint
            </div>
          </div>
        );
      })()}
      
      {/* Helper overlay when no scene */}
      {!activeScene && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/50 font-medium tracking-wide">Create or select a preset to begin</span>
        </div>
      )}
    </div>
  );
};
