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
import { SceneProvider } from './context/SceneContext';
import { AudioProvider } from './context/AudioContext';
import { RecordingProvider } from './context/RecordingContext';
import { StreamingProvider } from './context/StreamingContext';
import { VirtualCameraProvider } from './context/VirtualCameraContext';
import { FilterProvider } from './context/FilterContext';
import { useState } from 'react';

function App() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'presets' | 'audio' | 'effects' | 'time' | 'background' | 'lowerthirds' | 'magic' | 'gallery' | 'arrangement' | 'sources' | 'settings' | 'streaming' | 'vcam' | null>('presets');



  let RightPanel = null;
  if (activeSidebarTab === 'sources') {
    RightPanel = (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-hidden flex flex-col border-b border-slate-100">
          <SourcePanel selectedSourceId={selectedSourceId} onSelectSource={setSelectedSourceId} />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          <PropertiesPanel selectedSourceId={selectedSourceId} />
        </div>
      </div>
    );
  } else if (activeSidebarTab === 'settings') {
    RightPanel = <RecordingSettings onClose={() => setActiveSidebarTab(null)} />;
  } else if (activeSidebarTab === 'streaming') {
    RightPanel = <StreamingSettings onClose={() => setActiveSidebarTab(null)} />;
  } else if (activeSidebarTab === 'presets') {
    RightPanel = <PresetsPanel />;
  } else if (activeSidebarTab === 'audio') {
    RightPanel = <AudioMixer />;
  } else if (activeSidebarTab === 'effects') {
    RightPanel = <EffectsPanel />;
  } else if (activeSidebarTab === 'time') {
    RightPanel = <TimePanel />;
  } else if (activeSidebarTab === 'background') {
    RightPanel = <BackgroundPanel />;
  } else if (activeSidebarTab === 'lowerthirds') {
    RightPanel = <LowerThirdsPanel />;
  } else if (activeSidebarTab === 'magic') {
    RightPanel = <MagicEffectsPanel />;
  } else if (activeSidebarTab === 'gallery') {
    RightPanel = <GalleryPanel />;
  } else if (activeSidebarTab === 'arrangement') {
    RightPanel = <ArrangementPanel />;
  }

  return (
    <VirtualCameraProvider>
      <StreamingProvider>
        <RecordingProvider>
          <AudioProvider>
            <SceneProvider>
              <FilterProvider>
                <MainLayout 
                  header={<Header />}
                  preview={<PreviewArea selectedSourceId={selectedSourceId} onSelectSource={setSelectedSourceId} />}
                  controls={<Controls />}
                  scenes={<ScenePanel />}
                  rightPanel={RightPanel}
                  activeSidebarTab={activeSidebarTab}
                  onTabChange={setActiveSidebarTab as any}
                />
              </FilterProvider>
            </SceneProvider>
          </AudioProvider>
        </RecordingProvider>
      </StreamingProvider>
    </VirtualCameraProvider>
  );
}

export default App;
