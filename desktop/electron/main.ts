import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#64748b',
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Load the N-API C++ Engine
let nativeEngine: any;
try {
  // Determine path based on dev/prod environment
  const enginePath = isDev 
    ? path.join(__dirname, '../../../engine/build/Release/VideoStudioEngine.node')
    : path.join(process.resourcesPath, 'VideoStudioEngine.node');
  
  // Add the directory of the .node file to the PATH so that Windows can find the FFmpeg DLLs sitting next to it
  const engineDir = path.dirname(enginePath);
  process.env.PATH = `${engineDir};${process.env.PATH}`;
  
  console.log('Main Process: Loading native C++ engine at', enginePath);
  nativeEngine = require(enginePath);
} catch (e: any) {
  console.error('Failed to load native engine:', e.message);
}

// IPC Handlers
ipcMain.handle('camera:list', async () => {
  if (!nativeEngine) throw new Error('Native engine not loaded');
  return nativeEngine.getCameras();
});

ipcMain.handle('display:list', async () => {
  if (!nativeEngine) throw new Error('Native engine not loaded');
  return nativeEngine.getDisplays();
});

// Capture Router to share physical streams
const activeCameras = new Map<string, Set<string>>(); // deviceId -> set of sourceIds
const activeScreens = new Map<string, Set<string>>(); // displayId -> set of sourceIds

ipcMain.handle('camera:start', async (event, deviceId: string, sourceId: string) => {
  if (!nativeEngine) throw new Error('Native engine not loaded');
  
  if (!activeCameras.has(deviceId)) {
    activeCameras.set(deviceId, new Set([sourceId]));
    
    // Start native capture once
    nativeEngine.startCamera(deviceId, (frameBuffer: Buffer, width: number, height: number) => {
      // Fan out to all sources using this camera
      const sources = activeCameras.get(deviceId);
      if (sources) {
        for (const sId of sources) {
          // Optimize by broadcasting to the webContents
          event.sender.send(`video:frame:${sId}`, frameBuffer, width, height);
        }
      }
    });
  } else {
    // Already running, just add the source to the fan-out
    activeCameras.get(deviceId)?.add(sourceId);
  }
  return true;
});

ipcMain.handle('camera:stop', async (event, sourceId: string) => {
  if (!nativeEngine) return;
  // Find which camera this source belongs to
  for (const [deviceId, sources] of activeCameras.entries()) {
    if (sources.has(sourceId)) {
      sources.delete(sourceId);
      if (sources.size === 0) {
        nativeEngine.stopCamera();
        activeCameras.delete(deviceId);
      }
      break;
    }
  }
});

ipcMain.handle('display:start', async (event, displayId: string, sourceId: string) => {
  if (!nativeEngine) throw new Error('Native engine not loaded');
  
  if (!activeScreens.has(displayId)) {
    activeScreens.set(displayId, new Set([sourceId]));
    
    nativeEngine.startScreen(displayId, (frameBuffer: Buffer, width: number, height: number) => {
      const sources = activeScreens.get(displayId);
      if (sources) {
        for (const sId of sources) {
          event.sender.send(`video:frame:${sId}`, frameBuffer, width, height);
        }
      }
    });
  } else {
    activeScreens.get(displayId)?.add(sourceId);
  }
  return true;
});

ipcMain.handle('display:stop', async (event, sourceId: string) => {
  if (!nativeEngine) return;
  for (const [displayId, sources] of activeScreens.entries()) {
    if (sources.has(sourceId)) {
      sources.delete(sourceId);
      if (sources.size === 0) {
        nativeEngine.stopScreen();
        activeScreens.delete(displayId);
      }
      break;
    }
  }
});

import { dialog, desktopCapturer } from 'electron';
import fs from 'fs';

ipcMain.handle('powerpoint:select', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PowerPoint', extensions: ['ppt', 'pptx'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('powerpoint:start', async (event, sourceId: string, filePath: string) => {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  
  if (isWin) {
    const psScript = `
      $ErrorActionPreference = 'Stop'
      try {
        $ppt = [System.Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application')
      } catch {
        $ppt = New-Object -ComObject PowerPoint.Application
      }
      $ppt.Visible = -1
      $presentation = $ppt.Presentations.Open('${filePath.replace(/'/g, "''")}')
      $presentation.SlideShowSettings.ShowType = 2
      $slideshow = $presentation.SlideShowSettings.Run()
    `;
    const command = `powershell -Command "${psScript.replace(/\n/g, ';')}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) console.error("PowerPoint Start Error:", error);
      if (stderr) console.error("PowerPoint Start Stderr:", stderr);
    });
  } else if (isMac) {
    // Note: Mac uses POSIX paths or Mac paths, AppleScript might need POSIX file conversion
    const appleScript = `
      tell application "Microsoft PowerPoint"
        activate
        open (POSIX file "${filePath}")
        run slide show slide show settings of active presentation
      end tell
    `;
    exec(`osascript -e '${appleScript}'`);
  }

  // Poll for the window for up to 10 seconds
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const sources = await desktopCapturer.getSources({ types: ['window'] });
    
    // Log all window names so we can debug exactly what PowerPoint is calling itself!
    if (i === 19) {
      console.log("All open windows:", sources.map(s => s.name).join(", "));
    }

    const pptWindow = sources.find(s => 
      s.name.toLowerCase().includes('powerpoint') || 
      s.name.toLowerCase().includes('slide show') || 
      s.name.toLowerCase().includes(path.basename(filePath).toLowerCase()) ||
      s.name.toLowerCase().includes('diaporama')
    );
    if (pptWindow) {
      console.log("Found PowerPoint window:", pptWindow.name);
      // Wait for PowerPoint to actually render its window completely to prevent WebRTC GetFrame errors
      await new Promise(r => setTimeout(r, 1500));
      return pptWindow.id;
    }
  }
  return null;
});

ipcMain.handle('powerpoint:next', async () => {
  if (process.platform === 'win32') {
    exec(`powershell -Command "$ppt = [System.Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application'); $ppt.ActivePresentation.SlideShowWindow.View.Next()"`);
  } else if (process.platform === 'darwin') {
    exec(`osascript -e 'tell application "Microsoft PowerPoint" to go to next slide slide show view of slide show window 1'`);
  }
});

ipcMain.handle('powerpoint:prev', async () => {
  if (process.platform === 'win32') {
    exec(`powershell -Command "$ppt = [System.Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application'); $ppt.ActivePresentation.SlideShowWindow.View.Previous()"`);
  } else if (process.platform === 'darwin') {
    exec(`osascript -e 'tell application "Microsoft PowerPoint" to go to previous slide slide show view of slide show window 1'`);
  }
});

ipcMain.handle('powerpoint:stop', async () => {
  if (process.platform === 'win32') {
    exec(`powershell -Command "$ppt = [System.Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application'); $ppt.ActivePresentation.SlideShowWindow.View.Exit()"`);
  } else if (process.platform === 'darwin') {
    exec(`osascript -e 'tell application "Microsoft PowerPoint" to exit slide show slide show view of slide show window 1'`);
  }
});

ipcMain.handle('image:select', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('document:select', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['pdf', 'ppt', 'pptx'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('document:read', async (event, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  } catch (e) {
    return null;
  }
});

ipcMain.handle('image:read', async (event, filePath: string) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().substring(1);
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
  } catch (e) {
    return null;
  }
});

// --- Audio IPC Handlers ---

ipcMain.handle('audio:list-inputs', async () => {
  if (!nativeEngine) throw new Error('Native engine not loaded');
  return nativeEngine.getAudioInputDevices ? nativeEngine.getAudioInputDevices() : [];
});

ipcMain.handle('audio:list-outputs', async () => {
  if (!nativeEngine) throw new Error('Native engine not loaded');
  return nativeEngine.getAudioOutputDevices ? nativeEngine.getAudioOutputDevices() : [];
});

ipcMain.handle('audio:add-source', async (event, sourceId: string, deviceId: string, isDesktop: boolean) => {
  if (!nativeEngine || !nativeEngine.addAudioSource) return false;
  return nativeEngine.addAudioSource(sourceId, deviceId, isDesktop);
});

ipcMain.handle('audio:remove-source', async (event, sourceId: string) => {
  if (nativeEngine && nativeEngine.removeAudioSource) nativeEngine.removeAudioSource(sourceId);
});

ipcMain.handle('audio:set-volume', async (event, sourceId: string, volumeDb: number) => {
  if (nativeEngine && nativeEngine.setAudioVolume) nativeEngine.setAudioVolume(sourceId, volumeDb);
});

ipcMain.handle('audio:set-mute', async (event, sourceId: string, muted: boolean) => {
  if (nativeEngine && nativeEngine.setAudioMute) nativeEngine.setAudioMute(sourceId, muted);
});

ipcMain.handle('audio:set-solo', async (event, sourceId: string, solo: boolean) => {
  if (nativeEngine && nativeEngine.setAudioSolo) nativeEngine.setAudioSolo(sourceId, solo);
});

ipcMain.handle('audio:set-monitoring', async (event, deviceId: string) => {
  if (!nativeEngine || !nativeEngine.setAudioMonitoring) return false;
  return nativeEngine.setAudioMonitoring(deviceId);
});

// We only want ONE meter callback registered with the native engine, which then broadcasts to all WebContents.
let metersCallbackRegistered = false;

app.whenReady().then(() => {
  if (nativeEngine && nativeEngine.onAudioMeters) {
    nativeEngine.onAudioMeters((meters: any) => {
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('audio:meters', meters);
      });
    });
    metersCallbackRegistered = true;
  }
});

// --------------------------------------------------------
// RECORDING IPC HANDLERS
// --------------------------------------------------------

ipcMain.handle('recording:select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('recording:start', async (event, pathStr: string, settingsStr: string) => {
  if (!nativeEngine || !nativeEngine.startRecording) return false;
  return nativeEngine.startRecording(pathStr, settingsStr);
});

ipcMain.handle('recording:stop', async () => {
  if (nativeEngine && nativeEngine.stopRecording) {
    nativeEngine.stopRecording();
  }
});

ipcMain.handle('recording:update-layout', async (event, layoutJson: string) => {
  if (nativeEngine && nativeEngine.updateRecordingLayout) {
    try {
      const scene = JSON.parse(layoutJson);
      const layouts = (scene.sources || []).map((source: any) => ({
        id: source.id,
        x: Math.round(source.transform.x),
        y: Math.round(source.transform.y),
        width: Math.round(source.transform.width),
        height: Math.round(source.transform.height),
        zIndex: source.zIndex || 0
      }));
      nativeEngine.updateRecordingLayout(layouts);
    } catch (e) {
      console.error('Failed to parse layout:', e);
    }
  }
});

// --------------------------------------------------------
// STREAMING IPC HANDLERS
// --------------------------------------------------------
import { safeStorage } from 'electron';
import os from 'os';

const STREAMING_SETTINGS_PATH = path.join(os.homedir(), '.videostudio_streaming.json');

ipcMain.handle('streaming:save-settings', async (event, settings: any) => {
  try {
    // Encrypt stream key before saving
    if (settings.streamKey && safeStorage.isEncryptionAvailable()) {
      settings.encryptedStreamKey = safeStorage.encryptString(settings.streamKey).toString('base64');
      delete settings.streamKey; // Do not save raw key
    } else if (settings.streamKey) {
      // Fallback if encryption unavailable (should not happen on modern Windows)
      settings.encryptedStreamKey = Buffer.from(settings.streamKey).toString('base64');
      delete settings.streamKey;
    }
    fs.writeFileSync(STREAMING_SETTINGS_PATH, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Failed to save streaming settings:', e);
    return false;
  }
});

ipcMain.handle('streaming:load-settings', async () => {
  try {
    if (fs.existsSync(STREAMING_SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(STREAMING_SETTINGS_PATH, 'utf8'));
      // Decrypt stream key before sending to UI, but we should just send a masked version or keep it empty
      // so React doesn't store the raw key in state unnecessarily.
      const hasKey = !!settings.encryptedStreamKey;
      delete settings.encryptedStreamKey;
      return { ...settings, hasKey };
    }
  } catch (e) {
    console.error('Failed to load streaming settings:', e);
  }
  return null;
});

ipcMain.handle('streaming:start', async (event, currentKeyInput: string) => {
  if (!nativeEngine || !nativeEngine.startStreaming) return false;
  
  try {
    // Determine the actual stream key
    let streamKey = currentKeyInput;
    if (!streamKey || streamKey === '********') {
      // Load encrypted key from disk
      if (fs.existsSync(STREAMING_SETTINGS_PATH)) {
        const settings = JSON.parse(fs.readFileSync(STREAMING_SETTINGS_PATH, 'utf8'));
        if (settings.encryptedStreamKey) {
          const buffer = Buffer.from(settings.encryptedStreamKey, 'base64');
          if (safeStorage.isEncryptionAvailable()) {
            streamKey = safeStorage.decryptString(buffer);
          } else {
            streamKey = buffer.toString('utf8');
          }
        }
      }
    }

    if (!streamKey || streamKey === '********') {
      console.error('No valid stream key found');
      return false;
    }

    // Load settings to get URL
    const settings = fs.existsSync(STREAMING_SETTINGS_PATH) 
      ? JSON.parse(fs.readFileSync(STREAMING_SETTINGS_PATH, 'utf8'))
      : { serverUrl: 'rtmp://a.rtmp.youtube.com/live2' };
      
    const rtmpUrl = `${settings.serverUrl.replace(/\/$/, '')}/${streamKey}`;

    // Get FFmpeg path
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    
    // Pass to C++ engine
    return nativeEngine.startStreaming(ffmpegPath, rtmpUrl, JSON.stringify(settings));
  } catch (e) {
    console.error('Streaming start failed:', e);
    return false;
  }
});

ipcMain.handle('streaming:stop', async () => {
  if (nativeEngine && nativeEngine.stopStreaming) {
    nativeEngine.stopStreaming();
    return true;
  }
  return false;
});

// --------------------------------------------------------
// VIRTUAL CAMERA IPC HANDLERS
// --------------------------------------------------------
ipcMain.handle('vcam:start', async () => {
  if (nativeEngine && nativeEngine.startVirtualCamera) {
    return nativeEngine.startVirtualCamera();
  }
  return false;
});

ipcMain.handle('vcam:stop', async () => {
  if (nativeEngine && nativeEngine.stopVirtualCamera) {
    nativeEngine.stopVirtualCamera();
    return true;
  }
  return false;
});

// --------------------------------------------------------
// FILTERS IPC HANDLERS
// --------------------------------------------------------
ipcMain.handle('filters:update', async (event, sourceId: string, filters: any[]) => {
  if (nativeEngine && nativeEngine.updateSourceFilters) {
    return nativeEngine.updateSourceFilters(sourceId, filters);
  }
  return false;
});
