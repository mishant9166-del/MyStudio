import { Header } from './components/layout/Header';
import { MainLayout } from './components/layout/MainLayout';
import { ScenePanel } from './components/scenes/ScenePanel';
import { PreviewArea } from './components/preview/PreviewArea';
import { SourcePanel } from './components/sources/SourcePanel';
import { PropertiesPanel } from './components/sources/PropertiesPanel';
import { AudioMixer } from './components/audio/AudioMixer';
import { RecordingSettings } from './components/recording/RecordingSettings';
import { StreamingSettings } from './components/streaming/StreamingSettings';
import { PresetsPanel } from './components/sidebar/PresetsPanel';
import { EffectsPanel } from './components/effects/EffectsPanel';
import { TimePanel } from './components/time/TimePanel';
import { BackgroundPanel } from './components/effects/BackgroundPanel';
import { LowerThirdsPanel } from './components/effects/LowerThirdsPanel';
import { MagicEffectsPanel } from './components/effects/MagicEffectsPanel';
import { GalleryPanel } from './components/gallery/GalleryPanel';
import { ArrangementPanel } from './components/sidebar/ArrangementPanel';
import { Controls } from './components/controls/Controls';
import { SettingsModal } from './components/settings/SettingsModal';
import { SceneProvider } from './context/SceneContext';
import { AudioProvider } from './context/AudioContext';
import { RecordingProvider } from './context/RecordingContext';
import { StreamingProvider } from './context/StreamingContext';
import { VirtualCameraProvider } from './context/VirtualCameraContext';
import { FilterProvider } from './context/FilterContext';
import { useState, useEffect } from 'react';

function App() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'presets' | 'audio' | 'effects' | 'time' | 'background' | 'lowerthirds' | 'magic' | 'gallery' | 'arrangement' | 'sources' | 'settings' | 'streaming' | 'vcam' | null>('presets');



  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenMenu = () => {
      setActiveSidebarTab('sources');
    };
    window.addEventListener('open-source-menu', handleOpenMenu);
    return () => window.removeEventListener('open-source-menu', handleOpenMenu);
  }, []);

  const RightPanel = (
    <>
      <div className={`flex-col h-full bg-white ${activeSidebarTab === 'sources' ? 'flex' : 'hidden'}`}>
        <div className="flex-1 overflow-hidden flex flex-col border-b border-slate-100">
          <SourcePanel selectedSourceId={selectedSourceId} onSelectSource={setSelectedSourceId} />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          <PropertiesPanel selectedSourceId={selectedSourceId} />
        </div>
      </div>
      
      {activeSidebarTab === 'settings' && <RecordingSettings onClose={() => setActiveSidebarTab(null)} />}
      {activeSidebarTab === 'streaming' && <StreamingSettings onClose={() => setActiveSidebarTab(null)} />}
      {activeSidebarTab === 'presets' && <PresetsPanel selectedSourceId={selectedSourceId} onSelectSource={setSelectedSourceId} />}
      {activeSidebarTab === 'audio' && <AudioMixer />}
      {activeSidebarTab === 'effects' && <EffectsPanel />}
      {activeSidebarTab === 'time' && <TimePanel />}
      {activeSidebarTab === 'background' && <BackgroundPanel />}
      {activeSidebarTab === 'lowerthirds' && <LowerThirdsPanel />}
      {activeSidebarTab === 'magic' && <MagicEffectsPanel />}
      {activeSidebarTab === 'gallery' && <GalleryPanel />}
      {activeSidebarTab === 'arrangement' && <ArrangementPanel />}
    </>
  );

  return (
    <VirtualCameraProvider>
      <StreamingProvider>
        <RecordingProvider>
          <AudioProvider>
            <SceneProvider>
              <FilterProvider>
                <MainLayout 
                  header={<Header selectedSourceId={selectedSourceId} />}
                  preview={<PreviewArea selectedSourceId={selectedSourceId} onSelectSource={setSelectedSourceId} />}
                  controls={<Controls onOpenSettings={() => setIsSettingsModalOpen(true)} />}
                  scenes={<ScenePanel />}
                  rightPanel={RightPanel}
                  activeSidebarTab={activeSidebarTab}
                  onTabChange={setActiveSidebarTab as any}
                />
                {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />}
              </FilterProvider>
            </SceneProvider>
          </AudioProvider>
        </RecordingProvider>
      </StreamingProvider>
    </VirtualCameraProvider>
  );
}

export default App;
