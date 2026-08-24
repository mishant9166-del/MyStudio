import { useState } from 'react';
import { 
  X, Info, HelpCircle, User, Award, Image as ImageIcon, Video, Camera, 
  Volume2, Globe, Gamepad2, Monitor, Radio, Server, Cctv, PersonStanding, 
  Keyboard, AppWindow, CheckCircle2, Plus 
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

const TABS = [
  { id: 'general', label: 'General', icon: AppWindow },
  { id: 'account', label: 'Account', icon: User },
  { id: 'subscriptions', label: 'Subscriptions', icon: Award },
  { id: 'snapshots', label: 'Snapshots', icon: ImageIcon },
  { id: 'recordings', label: 'Recordings', icon: Video },
  { id: 'video', label: 'Video', icon: Camera },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'network', label: 'Network', icon: Globe },
  { id: 'game', label: 'Game', icon: Gamepad2 },
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'rtmp-streaming', label: 'RTMP Streaming', icon: Radio },
  { id: 'rtmp-server', label: 'RTMP Server', icon: Server },
  { id: 'ip-camera', label: 'IP Camera', icon: Cctv },
  { id: 'motion', label: 'Motion Detection', icon: PersonStanding },
  { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
];

export const SettingsModal = ({ onClose }: Props) => {
  const [activeTab, setActiveTab] = useState('general');

  // Toggle state placeholders
  const [toggles, setToggles] = useState({
    startup: true,
    notify: true,
    asyncFrame: false,
    keepSources: false,
    overlayMode: true,
    showLogo: true,
    betaDevice: false,
  });

  const toggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-[780px] h-[560px] rounded-lg shadow-2xl flex overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <div className="w-[180px] shrink-0 bg-[#f5f9fb] border-r border-slate-200 overflow-y-auto scrollbar-none py-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-5 py-2.5 text-xs transition-colors ${
                  isActive 
                    ? 'bg-[#e7f1f5] text-[#00a9eb] font-medium' 
                    : 'text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00a9eb]' : 'text-slate-400'}`} strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white p-8">
          
          {/* Dynamic Content based on activeTab */}
          {activeTab === 'general' && (
            <div className="space-y-8 max-w-[600px]">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-light text-slate-600">General Settings</h1>
                <div className="flex items-center space-x-6 mr-6">
                  <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                    <Info className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                    <span>About MyStudio</span>
                  </button>
                  <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                    <HelpCircle className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                    <span>Help Center</span>
                  </button>
                </div>
              </div>
              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Language</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>English</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { key: 'startup', label: 'Run MyStudio on Startup' },
                  { key: 'notify', label: 'Notify me about new MyStudio versions' },
                  { key: 'asyncFrame', label: 'Asynchronous frame transmission' },
                  { key: 'keepSources', label: 'Keep my video sources connected when MyStudio is hidden' },
                  { key: 'overlayMode', label: 'Switch to Overlay Mode when MyStudio is hidden' },
                  { key: 'showLogo', label: 'Show MyStudio Logo' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center space-x-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${toggles[item.key as keyof typeof toggles] ? 'bg-[#00a9eb]' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${toggles[item.key as keyof typeof toggles] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs text-slate-600 group-hover:text-slate-900">{item.label}</span>
                    <input type="checkbox" className="hidden" checked={toggles[item.key as keyof typeof toggles]} onChange={() => toggle(item.key as keyof typeof toggles)} />
                  </label>
                ))}
              </div>

              {/* Hardware Acceleration */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Hardware Acceleration <span className="font-normal italic text-slate-400 ml-1">Enabled (DirectX 11)</span>
                </label>
                <div className="flex space-x-4">
                  <select className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                    <option>Auto (Use when available)</option>
                  </select>
                  <select className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                    <option>Single Buffer</option>
                  </select>
                </div>
              </div>

              {/* Use Video Device */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Use Video Device:</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>&lt;System Default&gt;</option>
                </select>
              </div>

              <div className="h-px bg-slate-200 w-full my-6"></div>

              {/* Virtual Webcams */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-4">Virtual Webcams</label>
                
                <div className="border border-[#00a9eb] rounded-lg p-3 flex justify-between items-center bg-white shadow-sm mb-4">
                  <span className="text-slate-600 text-xs">MyStudio Virtual Webcam</span>
                  <div className="flex items-center space-x-2 text-[#00a9eb]">
                    <span className="text-xs">Ready</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <button className="flex items-center space-x-2 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium mb-6">
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Create New Virtual Camera</span>
                </button>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${toggles.betaDevice ? 'bg-[#00a9eb]' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${toggles.betaDevice ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-900">Enable MyStudio Video Device (Beta)</span>
                  <input type="checkbox" className="hidden" checked={toggles.betaDevice} onChange={() => toggle('betaDevice')} />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-8 max-w-[600px]">
              <div className="mb-4">
                <h2 className="text-lg text-slate-600 font-light mb-4">live.techrise@gmail.com — E TECHRISE INFRAS</h2>
                <div className="flex items-center space-x-6 text-[#00a9eb] text-xs font-medium">
                  <button className="flex items-center space-x-1.5 hover:text-[#0092cc]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>Refresh</span>
                  </button>
                  <button className="flex items-center space-x-1.5 hover:text-[#0092cc]">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="flex items-center space-x-1.5 hover:text-[#0092cc]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-3">Devices</label>
                <div className="space-y-2.5">
                  {[
                    'Ishant-desktop (This Device)',
                    'being-assets-bilaspur',
                    'DESKTOP-7S8A5MA',
                    'OXIDATIONCLASESS',
                    'Prayas-Nagpur01',
                    'DESKTOP-PBS8G8V'
                  ].map((device, i) => (
                    <div key={i} className="border border-slate-200 rounded p-3 flex items-center space-x-3 bg-white text-slate-600 text-xs">
                      <Monitor className="w-4 h-4 text-slate-400" />
                      <span>{device}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-8 max-w-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-lg font-light text-slate-600">Subscription Management</h1>
                <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                  <HelpCircle className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                  <span>Features & Pricing</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500">Your subscriptions</label>
                <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span>Refresh</span>
                </button>
              </div>

              <div className="mt-12">
                <label className="block text-xs font-semibold text-slate-500 mb-2">Have a promo code?</label>
                <div className="flex space-x-3">
                  <input type="text" placeholder="Enter your code" className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb] placeholder-slate-400" />
                  <button className="bg-[#00a9eb] hover:bg-[#0092cc] text-white px-6 py-1.5 rounded text-xs font-medium transition-colors">Apply</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Snapshot Settings</h1>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Save to</label>
                <div className="flex space-x-2">
                  <input type="text" defaultValue="C:\Users\tm32t\OneDrive\Pictures\MyStudio" className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                  <button className="px-3 border border-slate-300 rounded text-slate-500 hover:bg-slate-50 transition-colors">...</button>
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Save Copy</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Output File Naming</label>
                <div className="flex items-center space-x-3">
                  <input type="text" defaultValue="My Snapshot" className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                  <span className="text-xs text-slate-500">+ 1, 2, 3 ...</span>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full my-6"></div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Shutter Delay and Sound</label>
                <select className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb] mb-4">
                  <option>Immediate</option>
                </select>

                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="w-10 h-5 rounded-full relative transition-colors bg-[#00a9eb]">
                    <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-5"></div>
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-900">Play shutter sound</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'recordings' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Recording Settings</h1>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Save to</label>
                <div className="flex space-x-2">
                  <input type="text" defaultValue="C:\Users\tm32t\Videos\MyStudio" className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                  <button className="px-3 border border-slate-300 rounded text-slate-500 hover:bg-slate-50 transition-colors">...</button>
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Save Copy</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Output File Naming</label>
                <div className="flex items-center space-x-3">
                  <input type="text" defaultValue="My Recording" className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                  <span className="text-xs text-slate-500">+ 1, 2, 3 ...</span>
                </div>
              </div>

              <div className="h-px bg-slate-200 w-full my-6"></div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Recording Format</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>MP4</option>
                </select>
              </div>

              <div>
                <label className="flex items-center text-xs font-semibold text-slate-500 mb-2">
                  <span>Encoder</span>
                  <HelpCircle className="w-3.5 h-3.5 ml-1 text-[#00a9eb]" />
                </label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Intel Quick Sync (Hardware)</option>
                </select>
              </div>

              <div className="flex space-x-6">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Bitrate type</label>
                  <select className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                    <option>CBR</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Video bitrate (Kbit/s)</label>
                  <input type="text" defaultValue="2900" className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-[#00a9eb]">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-5"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Use recommended bitrate settings</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Preset</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Quality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Audio bitrate (Kbit/s)</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>128</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Video Settings</h1>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-4">Select the resolutions you want to make available on the MyStudio Main Window</label>
                
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 mb-6">
                  {/* Col 1 */}
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">160x120</span></label>
                  {/* Col 2 */}
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">512x384</span></label>
                  {/* Col 3 */}
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-[#00a9eb]"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-4"></div></div><span className="text-xs text-slate-600">1280x720</span></label>

                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">176x144</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-[#00a9eb]"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-4"></div></div><span className="text-xs text-slate-600">640x360</span></label>
                  <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed group"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg><span className="text-xs text-slate-600">1280x960</span></label>

                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">320x180</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-[#00a9eb]"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-4"></div></div><span className="text-xs text-slate-600">640x480</span></label>
                  <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed group"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg><span className="text-xs text-slate-600">1600x1200</span></label>

                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-[#00a9eb]"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-4"></div></div><span className="text-xs text-slate-600">320x240</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">800x600</span></label>
                  <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed group"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg><span className="text-xs text-slate-600">1920x1080</span></label>

                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">352x288</span></label>
                  <label className="flex items-center space-x-2 cursor-pointer group"><div className="w-8 h-4 rounded-full relative transition-colors bg-slate-300"><div className="absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform translate-x-0"></div></div><span className="text-xs text-slate-600">1024x768</span></label>
                  <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed group"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg><span className="text-xs text-slate-600">1920x1440</span></label>

                  <div className="col-span-2"></div>
                  <label className="flex items-center space-x-2 opacity-50 cursor-not-allowed group"><svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg><span className="text-xs text-slate-600">3840x2160</span></label>
                </div>

                <div className="flex items-center space-x-8 mb-8 mt-4 border-b border-slate-200 pb-4">
                  <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>Select All</span>
                  </button>
                  <button className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-600 text-xs font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    <span>Clear All</span>
                  </button>
                  <div className="flex-1 text-right">
                    <button className="text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">Reset to default</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Frames per second (FPS)</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>30</option>
                  <option>60</option>
                </select>
              </div>

              <div className="h-px bg-slate-200 w-full my-6"></div>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-[#00a9eb]">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-5"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Enable antialiasing for live preview rendering</span>
              </label>

              <div className="h-px bg-slate-200 w-full my-6"></div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Multimedia framework for video files</label>
                <select className="w-[400px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Prefer Media Foundation (Hardware)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Web-camera MJPEG decoder</label>
                <select className="w-[400px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Auto</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Audio Settings</h1>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Audio Playback Device</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Default playback device</option>
                </select>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group mt-6">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Listen to the Sound From Your Microphones</span>
              </label>

              <p className="text-xs text-slate-400 italic font-light">
                Note: All added microphones and system sounds will be played back through the audio playback device for testing.
              </p>

              <div className="mt-8">
                <label className="flex items-center space-x-3 cursor-pointer group mb-4">
                  <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300">
                    <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                  </div>
                  <span className="text-xs text-slate-600 group-hover:text-slate-900">Noise Suppression</span>
                </label>

                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-500">0 dB</span>
                  <div className="flex-1 h-1 bg-slate-200 rounded-full relative">
                    <div className="absolute left-0 top-0 h-full bg-[#00a9eb] rounded-full w-[10%]"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-[10%] w-3 h-3 bg-[#00a9eb] rounded-full shadow cursor-pointer"></div>
                  </div>
                  <span className="text-xs text-slate-500">-50 dB</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Network Settings</h1>
              
              <label className="flex items-center space-x-3 cursor-pointer group mb-6">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Use proxy settings</span>
              </label>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Address</label>
                  <input type="text" placeholder="http://" className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb] placeholder-slate-400" />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Port</label>
                  <input type="text" defaultValue="0" className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Username</label>
                <input type="text" placeholder="Optional" className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb] placeholder-slate-400" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Password</label>
                <input type="text" placeholder="Optional" className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb] placeholder-slate-400" />
              </div>
            </div>
          )}

          {activeTab === 'game' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Game Settings</h1>
              
              <label className="flex items-center space-x-3 cursor-pointer group mb-2">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Launch game when choosing it as a video source</span>
              </label>

              <p className="text-xs text-slate-400 italic font-light mb-4">
                Add System sound as an audio input to capture game audio
              </p>

              <div className="h-px bg-slate-200 w-full mb-6 mt-4"></div>

              <button className="flex items-center space-x-2 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Add Game</span>
              </button>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-6 max-w-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-lg font-light text-slate-600">Desktop Settings</h1>
                <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                  <HelpCircle className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                  <span>Learn how to use Desktop Capture</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'desktop1', label: 'Capture cursor', checked: true },
                  { id: 'desktop2', label: 'Capture layered windows', checked: false },
                  { id: 'desktop3', label: 'Animate mouse clicks', checked: true },
                  { id: 'desktop4', label: 'Show rectangle around cursor', checked: true },
                  { id: 'desktop5', label: 'Stick rectangle to mouse cursor', checked: false },
                  { id: 'desktop6', label: 'Accelerated capturing (Windows 8.1 or higher)', checked: true },
                  { id: 'desktop7', label: 'Capture Hardware Accelerated Windows (Windows 8.1 or higher)', checked: false },
                ].map(item => (
                  <label key={item.id} className="flex items-center space-x-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${item.checked ? 'bg-[#00a9eb]' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${item.checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-xs text-slate-600 group-hover:text-slate-900">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="h-px bg-slate-200 w-full my-6"></div>

              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <span className="text-xs font-semibold text-slate-500 w-20">Zoom in:</span>
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 border border-slate-200 text-slate-400 font-medium px-4 py-1.5 rounded text-xs min-w-[50px] text-center">Alt</div>
                    <Plus className="w-4 h-4 text-slate-400" />
                    <div className="bg-white border border-slate-300 text-slate-600 font-medium px-4 py-1.5 rounded text-xs min-w-[50px] text-center shadow-sm">A</div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <span className="text-xs font-semibold text-slate-500 w-20">Zoom out:</span>
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-100 border border-slate-200 text-slate-400 font-medium px-4 py-1.5 rounded text-xs min-w-[50px] text-center">Alt</div>
                    <Plus className="w-4 h-4 text-slate-400" />
                    <div className="bg-white border border-slate-300 text-slate-600 font-medium px-4 py-1.5 rounded text-xs min-w-[50px] text-center shadow-sm">S</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rtmp-streaming' && (
            <div className="space-y-6 max-w-[600px] relative">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-lg font-light text-slate-600">RTMP Streaming Settings</h1>
                <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                  <HelpCircle className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                  <span>Learn how to use RTMP</span>
                </button>
              </div>

              <div>
                <label className="flex items-center text-xs font-semibold text-slate-500 mb-2">
                  <span>Encoder</span>
                  <HelpCircle className="w-3.5 h-3.5 ml-1 text-[#00a9eb]" />
                </label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Intel Quick Sync (Hardware)</option>
                </select>
              </div>

              <div className="flex space-x-6">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Bitrate type</label>
                  <select disabled className="w-full bg-slate-50 text-slate-400 border border-slate-200 rounded px-3 py-1.5 text-xs outline-none cursor-not-allowed">
                    <option>CBR</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Video bitrate (Kbit/s)</label>
                  <input type="text" disabled defaultValue="3000" className="w-full bg-slate-50 text-slate-400 border border-slate-200 rounded px-3 py-1.5 text-xs outline-none cursor-not-allowed" />
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-10 h-5 rounded-full relative transition-colors bg-[#00a9eb]">
                  <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-5"></div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-900">Use recommended bitrate settings</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Preset</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>Quality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Audio bitrate (Kbit/s)</label>
                <select className="w-[300px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]">
                  <option>128</option>
                </select>
              </div>

              <div className="absolute bottom-0 right-0">
                <button className="text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">Reset to default</button>
              </div>
            </div>
          )}

          {activeTab === 'rtmp-server' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">RTMP Server Settings</h1>
              
              <button className="flex items-center space-x-2 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Add RTMP server</span>
              </button>
            </div>
          )}

          {activeTab === 'ip-camera' && (
            <div className="space-y-6 max-w-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-lg font-light text-slate-600">IP Camera Settings</h1>
                <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                  <HelpCircle className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                  <span>Learn how to use an IP camera</span>
                </button>
              </div>
              
              <button className="flex items-center space-x-2 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Add IP Camera</span>
              </button>
            </div>
          )}

          {activeTab === 'motion' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-lg font-light text-slate-600 mb-8">Motion Detection</h1>
              
              <button className="flex items-center space-x-2 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <span>Edit Preset Rules</span>
              </button>
            </div>
          )}

          {activeTab === 'hotkeys' && (
            <div className="flex flex-col h-full max-w-[650px] relative">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h1 className="text-lg font-light text-slate-600">Hotkeys</h1>
                <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                  <HelpCircle className="w-4 h-4 fill-current text-white" strokeWidth={1} />
                  <span>Learn more about hotkeys</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 pb-20 space-y-6">
                
                {/* 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Transition between presets (1 - 10):</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Alt" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="bg-slate-50 border border-slate-200 text-slate-400 font-medium px-4 py-1.5 rounded text-xs min-w-[60px] text-center">1..0</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Cut between presets (1 - 10):</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="bg-slate-50 border border-slate-200 text-slate-400 font-medium px-4 py-1.5 rounded text-xs min-w-[60px] text-center">1..0</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 3 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Preview preset (1 - 10):</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="bg-slate-50 border border-slate-200 text-slate-400 font-medium px-4 py-1.5 rounded text-xs min-w-[60px] text-center">1..0</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 4 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Transition to next/previous preset:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="flex bg-slate-50 border border-slate-200 rounded text-slate-400 h-[34px]">
                        <button className="px-3 border-r border-slate-200 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
                        </button>
                        <button className="px-3 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </button>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 5 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Cut to next/previous preset:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="flex bg-slate-50 border border-slate-200 rounded text-slate-400 h-[34px]">
                        <button className="px-3 border-r border-slate-200 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
                        </button>
                        <button className="px-3 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 6 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Next/Previous playlist item:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="flex bg-slate-50 border border-slate-200 rounded text-slate-400 h-[34px]">
                        <button className="px-3 border-r border-slate-200 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
                        </button>
                        <button className="px-3 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 7 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Next/Previous presentation slide:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[180px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <Plus className="w-4 h-4 text-slate-400" />
                      <div className="flex bg-slate-50 border border-slate-200 rounded text-slate-400 h-[34px]">
                        <button className="px-3 border-r border-slate-200 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
                        </button>
                        <button className="px-3 hover:bg-slate-100 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 8 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Show/Hide all effects:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 9 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Show/Hide MyStudio to notification area:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 10 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Show/Hide Video Overlay:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+Shift+V" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-[#00a9eb] cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-5"></div>
                    </div>
                  </div>
                </div>

                {/* 11 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Mute all sounds:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 12 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Mute active preset:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 13 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Start/Stop recording:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 14 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Pause/Resume recording:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 15 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Stop RTMP streaming:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 16 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Pause/Resume RTMP streaming:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 17 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Pause/Resume driver streams:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <button className="text-slate-400 hover:text-slate-600 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 18 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Take snapshot:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 19 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Quit from MyStudio:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+Q" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <button className="text-slate-400 hover:text-slate-600 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 20 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Draw: Show/Hide overlay:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 21 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Draw: Clear overlay:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 22 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Draw: Move video layers:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 23 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Draw: Stamps tool:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <button className="text-slate-400 hover:text-slate-600 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 24 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Draw: Shapes tool:</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 25 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Add new layer</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+N" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 26 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Clear layer</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Shift+Del" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 27 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Bring layer to front</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+Shift+[" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 28 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Send layer backward</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+]" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                      <button className="text-slate-400 hover:text-slate-600 ml-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                      <button className="text-slate-400 hover:text-slate-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 29 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Send layer to back</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+Shift+]" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 30 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Fit layer to screen</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>

                {/* 31 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Lock/Unlock layer</label>
                    <div className="flex items-center space-x-3">
                      <input type="text" defaultValue="Ctrl+Shift+L" className="w-[200px] bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-[#00a9eb]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-6">
                    <span className="text-xs text-slate-600">Global</span>
                    <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                      <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-2 border-t border-slate-200 flex items-center justify-between pr-4 z-10">
                <div className="flex items-center space-x-8">
                  <button className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-600 text-xs font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    <span className="text-[#00a9eb]">Clear All</span>
                  </button>
                  <button className="flex items-center space-x-1.5 text-[#00a9eb] hover:text-[#0092cc] text-xs font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span>Reset to default</span>
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-600 font-medium">Set all to Global</span>
                  <div className="w-10 h-5 rounded-full relative transition-colors bg-slate-300 cursor-pointer">
                    <div className="absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform translate-x-0"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Scrollbar gutter */}
          <div className="h-10 shrink-0"></div>
        </div>

      </div>
    </div>
  );
};
