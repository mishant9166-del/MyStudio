import { useState, useEffect } from 'react';
import { 
  X, Info, HelpCircle, User, Award, Image as ImageIcon, Video, Camera, 
  Volume2, Globe, Gamepad2, Monitor, Radio, Server, Cctv, PersonStanding, 
  Keyboard, AppWindow, CheckCircle2, Plus 
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  initialTab?: string;
  user?: { name: string, email?: string, phone?: string, user_id?: string } | null;
  onSuccess?: (user: { name: string, email?: string, phone?: string, user_id?: string } | null) => void;
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

export const SettingsModal = ({ onClose, onOpenAuth, initialTab = 'general', user, onSuccess }: Props) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accountView, setAccountView] = useState<'profile' | 'devices'>('profile');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [snapshotPath, setSnapshotPath] = useState('C:\\Users\\Default\\Pictures\\MyStudio');

  useEffect(() => {
    const savedPath = localStorage.getItem('mystudio_snapshot_path');
    if (savedPath) {
      setSnapshotPath(savedPath);
    } else if ((window as any).electronAPI?.getPicturesPath) {
      (window as any).electronAPI.getPicturesPath().then(setSnapshotPath).catch(() => {});
    }
  }, []);

  const handleSelectSnapshotFolder = async () => {
    if ((window as any).electronAPI?.selectOutputFolder) {
      const folder = await (window as any).electronAPI.selectOutputFolder();
      if (folder) {
        setSnapshotPath(folder);
        localStorage.setItem('mystudio_snapshot_path', folder);
      }
    }
  };

  const [isSaveCopyEnabled, setIsSaveCopyEnabled] = useState(() => localStorage.getItem('mystudio_save_copy') === 'true');
  const [copyPaths, setCopyPaths] = useState<string[]>(() => {
    const saved = localStorage.getItem('mystudio_copy_paths');
    return saved ? JSON.parse(saved) : [];
  });
  const [snapshotPrefix, setSnapshotPrefix] = useState(() => localStorage.getItem('mystudio_snapshot_prefix') || 'My Snapshot');
  const [shutterDelay, setShutterDelay] = useState(() => {
    const saved = localStorage.getItem('mystudio_shutter_delay');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playShutterSound, setPlayShutterSound] = useState(() => localStorage.getItem('mystudio_shutter_sound') !== 'false');
  
  const handleAddCopyPath = async () => {
    if ((window as any).electronAPI?.selectOutputFolder) {
      const folder = await (window as any).electronAPI.selectOutputFolder();
      if (folder && !copyPaths.includes(folder)) {
        const newPaths = [...copyPaths, folder];
        setCopyPaths(newPaths);
        localStorage.setItem('mystudio_copy_paths', JSON.stringify(newPaths));
      }
    }
  };
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<{status: string, plan: string} | null>(null);

  useEffect(() => {
    if (!user || activeTab !== 'account' || licenseInfo) return;

    if (!user.user_id) {
      setLicenseInfo({ status: 'No License', plan: 'No Active Plan' });
      return;
    }

    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'DEV-' + Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem('device_id', deviceId);
    }

    fetch(`http://localhost:3001/v1/verify-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.user_id, device_id: deviceId, software_version: '1.0.0' })
    })
      .then(res => res.json())
      .then(data => setLicenseInfo(data))
      .catch(err => {
        console.error("Failed to fetch license", err);
        setLicenseInfo({ status: 'No License', plan: 'No Active Plan' });
      });
  }, [user, activeTab, licenseInfo]);

  const handleOAuth = (provider: 'google' | 'facebook' | 'twitter') => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(`http://localhost:3001/v1/auth/${provider}`, 'OAuth', `width=${width},height=${height},left=${left},top=${top}`);
    
    const messageListener = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_SUCCESS') {
        if (onSuccess) onSuccess(event.data.user);
        window.removeEventListener('message', messageListener);
      } else if (event.data?.type === 'AUTH_ERROR') {
        setError('Authentication failed');
        window.removeEventListener('message', messageListener);
      }
    };
    window.addEventListener('message', messageListener);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800)); // fake refresh delay
    setIsRefreshing(false);
  };

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
            user ? (
              <div className="pr-4 max-w-xl text-left mt-2">
                <h2 className="text-2xl font-light text-slate-600 mb-8 capitalize">{user.name}</h2>
                
                <div className="flex space-x-8 mb-12">
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center space-x-2 text-[#30c4f8] hover:text-[#0b98c5] font-medium text-[13px] transition-colors disabled:opacity-70"
                  >
                    <svg className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                  <button 
                    onClick={() => setAccountView(accountView === 'profile' ? 'devices' : 'profile')}
                    className="flex items-center space-x-2 text-[#30c4f8] hover:text-[#0b98c5] font-medium text-[13px] transition-colors"
                  >
                    {accountView === 'profile' ? (
                      <>
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Devices</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => onSuccess?.(null)}
                    className="flex items-center space-x-2 text-[#30c4f8] hover:text-[#0b98c5] font-medium text-[13px] transition-colors"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>

                {accountView === 'profile' ? (
                  isUpdatingPassword ? (
                    <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h3 
                        className="text-[13px] font-semibold text-slate-500 mb-3 flex items-center cursor-pointer hover:text-slate-700 w-fit" 
                        onClick={() => setIsUpdatingPassword(false)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Profile
                      </h3>
                      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm inline-block min-w-[320px]">
                        <h4 className="text-[15px] font-bold text-slate-800 mb-4">Update Password</h4>
                        
                        <div className="space-y-3 max-w-[280px]">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Current Password</label>
                            <input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }} className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[13px] text-slate-800 outline-none focus:border-[#30c4f8]" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">New Password</label>
                            <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }} className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[13px] text-slate-800 outline-none focus:border-[#30c4f8]" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }} className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-[13px] text-slate-800 outline-none focus:border-[#30c4f8]" />
                          </div>
                        </div>

                        {passwordError && <div className="mt-3 text-[11px] font-medium text-red-500 bg-red-50 p-2 rounded border border-red-100 max-w-[280px]">{passwordError}</div>}
                        {passwordSuccess && <div className="mt-3 text-[11px] font-medium text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100 max-w-[280px]">{passwordSuccess}</div>}

                        <div className="mt-5 flex space-x-2">
                          <button 
                            disabled={loading}
                            onClick={async () => {
                              if (!currentPassword || !newPassword || !confirmPassword) return setPasswordError('Please fill all fields');
                              if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match');
                              
                              setPasswordError('');
                              setPasswordSuccess('');
                              setLoading(true);
                              
                              try {
                                const res = await fetch('http://localhost:3001/v1/auth/password', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: user?.email || user?.name, current_password: currentPassword, new_password: newPassword })
                                });
                                const data = await res.json();
                                if (!res.ok || data.error) throw new Error(data.error || 'Failed to update password');
                                
                                setPasswordSuccess('Password updated successfully!');
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setTimeout(() => setIsUpdatingPassword(false), 2000);
                              } catch(err: any) {
                                setPasswordError(err.message || 'Network error');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className={`px-4 py-1.5 text-white rounded text-[12px] font-medium transition-colors shadow-sm flex items-center space-x-1.5 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#30c4f8] hover:bg-[#0b98c5]'}`}
                          >
                            {loading && <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            <span>{loading ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button 
                            disabled={loading} 
                            onClick={() => setIsUpdatingPassword(false)} 
                            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[12px] font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-[13px] font-semibold text-slate-500 mb-3">Profile Details</h3>
                    <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
                      <div className="flex items-start space-x-6">
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                          [
                            'from-[#20c0f3] to-[#00d084]',
                            'from-red-400 to-red-600',
                            'from-amber-400 to-orange-500',
                            'from-violet-400 to-purple-500',
                            'from-blue-400 to-indigo-500',
                            'from-emerald-400 to-teal-500'
                          ][(user.name.charCodeAt(0) || 0) % 6]
                        } text-white flex items-center justify-center text-4xl font-bold shadow-md shrink-0`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-bold text-slate-800 truncate capitalize">{user.name}</h4>
                          {licenseInfo ? (
                            <div className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full mt-2 tracking-wide uppercase ${
                              licenseInfo.status === 'Active' ? 'bg-[#e6f7ff] text-[#00a8e8]' : 
                              licenseInfo.status === 'No License' ? 'bg-slate-100 text-slate-500' :
                              'bg-red-50 text-red-500'
                            }`}>
                              {licenseInfo.status === 'No License' ? 'No Active Plan' : `${licenseInfo.plan} ${licenseInfo.status}`}
                            </div>
                          ) : (
                            <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-400 text-[11px] font-bold rounded-full mt-2 tracking-wide uppercase animate-pulse">
                              Loading...
                            </div>
                          )}
                          
                          <div className="mt-5 grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Email</div>
                              {(!user.email || user.email.includes('@oauth.mystudio.com')) ? (
                                isAddingEmail ? (
                                  <div className="flex flex-col space-y-1.5 mt-0.5 w-[140px]">
                                    <input 
                                      type="email" 
                                      value={newEmail} 
                                      onChange={e => { setNewEmail(e.target.value); setEmailError(''); }} 
                                      placeholder="Email address" 
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] text-slate-800 outline-none focus:border-[#30c4f8]"
                                    />
                                    {emailError && <span className="text-[10px] text-red-500 leading-tight">{emailError}</span>}
                                    <div className="flex space-x-1.5 pt-0.5">
                                      <button 
                                        disabled={loading}
                                        onClick={async () => {
                                          if (!newEmail || !newEmail.includes('@')) return setEmailError('Invalid email');
                                          setEmailError('');
                                          setLoading(true);
                                          try {
                                            const res = await fetch('http://localhost:3001/v1/auth/email', {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ email: user.email || user.name, new_email: newEmail })
                                            });
                                            const data = await res.json();
                                            if (!res.ok || data.error) throw new Error(data.error || 'Failed to add email');
                                            if (onSuccess) onSuccess({ ...user, email: newEmail });
                                            setIsAddingEmail(false);
                                          } catch (err: any) {
                                            setEmailError(err.message || 'Error saving email');
                                          } finally {
                                            setLoading(false);
                                          }
                                        }}
                                        className="px-2 py-0.5 bg-[#30c4f8] hover:bg-[#0b98c5] text-white rounded text-[10px] font-medium transition-colors"
                                      >Save</button>
                                      <button onClick={() => setIsAddingEmail(false)} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium transition-colors">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => { setIsAddingEmail(true); setEmailError(''); setNewEmail(''); }}
                                    className="text-[12px] text-[#30c4f8] font-medium hover:text-[#0b98c5] hover:underline flex items-center"
                                  >
                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Email
                                  </button>
                                )
                              ) : (
                                <div className="text-[13px] text-slate-700 font-medium truncate" title={user.email}>
                                  {user.email}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Phone Number</div>
                              {user.phone ? (
                                <div className="text-[13px] text-slate-700 font-medium truncate flex items-center">
                                  <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  {user.phone.length === 10 ? `+91 ${user.phone}` : user.phone}
                                </div>
                              ) : isAddingPhone ? (
                                <div className="flex flex-col space-y-1.5 mt-0.5">
                                  <input 
                                    type="text" 
                                    value={newPhone} 
                                    onChange={e => { setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError(''); }} 
                                    placeholder="10-digit number" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[12px] text-slate-800 outline-none focus:border-[#30c4f8]"
                                  />
                                  {phoneError && <span className="text-[10px] text-red-500 leading-tight">{phoneError}</span>}
                                  <div className="flex space-x-1.5 pt-0.5">
                                    <button 
                                      disabled={loading}
                                      onClick={async () => {
                                        if (newPhone.length !== 10) return setPhoneError('Must be 10 digits');
                                        setPhoneError('');
                                        setLoading(true);
                                        try {
                                          const res = await fetch('http://localhost:3001/v1/auth/phone', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: user.email || user.name, phone: newPhone })
                                          });
                                          const data = await res.json();
                                          if (!res.ok || data.error) throw new Error(data.error || 'Failed to add phone');
                                          if (onSuccess) onSuccess({ ...user, phone: newPhone });
                                          setIsAddingPhone(false);
                                        } catch (err: any) {
                                          setPhoneError(err.message || 'Error saving phone');
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-[#30c4f8] hover:bg-[#0b98c5] text-white rounded text-[10px] font-medium transition-colors"
                                    >Save</button>
                                    <button onClick={() => setIsAddingPhone(false)} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-medium transition-colors">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setIsAddingPhone(true); setPhoneError(''); setNewPhone(''); }}
                                  className="text-[12px] text-[#30c4f8] font-medium hover:text-[#0b98c5] hover:underline flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                  Add Number
                                </button>
                              )}
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Account Status</div>
                              <div className="text-[13px] text-emerald-600 font-medium flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                                Active
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {user.user_id?.startsWith('TR-U') && (
                        <>
                          <div className="h-px bg-slate-100 w-full my-6"></div>
                          
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-[13px] font-semibold text-slate-700">Password & Security</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">Manage your password to keep your account secure</div>
                            </div>
                            <button 
                              onClick={() => { setIsUpdatingPassword(true); setPasswordError(''); setPasswordSuccess(''); }}
                              className="px-4 py-2 border border-slate-300 hover:border-[#30c4f8] hover:text-[#30c4f8] hover:bg-slate-50 text-slate-600 rounded text-[12px] font-medium transition-colors bg-white"
                            >
                              Update Password
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  )
                ) : (
                  <div className="mt-2">
                    <h3 className="text-[13px] font-semibold text-slate-500 mb-3">Devices</h3>
                    <div className="border border-slate-300 rounded p-3 flex items-center space-x-3 text-slate-700 bg-white shadow-sm">
                      <svg className="w-[18px] h-[18px] text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[13px]">{user.name.split('@')[0]}-desktop (This Device)</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
            <div className="pr-4 max-w-xl">
              <h2 className="text-xl font-light text-slate-600 mb-6 tracking-wide">Account & Devices</h2>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Use existing account</label>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button onClick={() => handleOAuth('facebook')} className="flex items-center justify-center space-x-2 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded py-2 transition-colors shadow-sm">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span className="text-sm font-medium">Facebook</span>
                  </button>
                  <button onClick={() => handleOAuth('twitter')} className="flex items-center justify-center space-x-2 bg-[#00aced] hover:bg-[#008fca] text-white rounded py-2 transition-colors shadow-sm">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    <span className="text-sm font-medium">Twitter</span>
                  </button>
                  <button onClick={() => handleOAuth('google')} className="flex items-center justify-center space-x-2 bg-[#5484ea] hover:bg-[#3d6ed7] text-white rounded py-2 transition-colors shadow-sm">
                    <div className="bg-white p-0.5 rounded-sm flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M23.49 12.275c0-.79-.07-1.54-.19-2.275H12v4.51h6.476a5.556 5.556 0 01-2.413 3.64v3.013h3.9c2.285-2.106 3.601-5.207 3.601-8.628z" fill="#4285F4"/><path d="M12 24c3.24 0 5.95-1.076 7.925-2.915l-3.9-3.012c-1.08.723-2.454 1.15-4.025 1.15-3.09 0-5.712-2.087-6.643-4.896H1.31v3.111C3.284 21.365 7.29 24 12 24z" fill="#34A853"/><path d="M5.357 14.327a7.2 7.2 0 01-.378-2.327c0-.81.14-1.59.378-2.327V6.562H1.31A11.968 11.968 0 000 12c0 1.93.456 3.754 1.25 5.378l4.107-3.051z" fill="#FBBC05"/><path d="M12 4.776c1.76 0 3.34.606 4.584 1.79l3.44-3.44C17.946 1.19 15.236 0 12 0 7.29 0 3.284 2.635 1.31 6.562l4.047 3.11C6.288 6.863 8.91 4.776 12 4.776z" fill="#EA4335"/></svg>
                    </div>
                    <span className="text-sm font-medium">Google</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 mb-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">E-mail</label>
                  <input 
                    type="email" 
                    value={accountEmail}
                    onChange={(e) => {
                      setAccountEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="live.mystudio@gmail.com" 
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#71d3f4] placeholder-slate-400" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Password</label>
                  <input 
                    type="password" 
                    value={accountPassword}
                    onChange={(e) => {
                      setAccountPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Password" 
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#71d3f4] placeholder-slate-400" 
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6 mt-1">
                <div className="text-red-500 text-[11px] font-medium">{error}</div>
                <button className="text-[#5bc5eb] hover:text-[#0092cc] text-xs font-medium ml-auto">Password recovery</button>
              </div>

              <button 
                disabled={loading}
                onClick={async () => {
                  if (loading) return;
                  if (!accountEmail || !accountPassword) {
                    setError('Please enter your email and password');
                    return;
                  }
                  try {
                    setLoading(true);
                    setError('');
                    const res = await fetch('http://localhost:3001/v1/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email_or_phone: accountEmail, password: accountPassword })
                    });
                    const data = await res.json();
                    if (!res.ok || data.error) {
                      setError(data.error || 'Login failed');
                    } else {
                      onSuccess?.({ name: data.name, email: data.email || accountEmail, phone: data.phone, user_id: data.user_id });
                    }
                  } catch (err: any) {
                    setError('Network error. Is the server running?');
                  } finally {
                    setLoading(false);
                  }
                }}
                className={`w-full text-white rounded py-2.5 text-sm font-medium transition-colors mb-6 shadow-sm flex items-center justify-center space-x-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#71d3f4] hover:bg-[#5bc5eb]'}`}
              >
                {loading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                <span>{loading ? 'Logging in...' : 'Login'}</span>
              </button>

              <div className="h-px bg-slate-200 w-full mb-6"></div>

              <p className="text-xs text-slate-500 leading-relaxed mb-6 pr-12">
                To have a lightning-fast access to all of your remote devices use your MyStudio account. It keeps all your cameras in one place.
              </p>

              <div className="text-xs text-slate-500">
                Don't have an account yet? <button onClick={() => { onClose(); onOpenAuth?.('signup'); }} className="text-[#5bc5eb] hover:text-[#0092cc] font-medium ml-1">Create one now!</button>
              </div>
            </div>
            )
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

          {activeTab === 'snapshots' && (
            <div className="space-y-6 max-w-[600px]">
              <h1 className="text-[22px] font-light text-slate-500 tracking-wide mb-8">Snapshot Settings</h1>
              
              {/* Save to */}
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-slate-500">Save to</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={snapshotPath} 
                    readOnly
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-[13px] text-slate-600 focus:outline-none"
                  />
                  <button 
                    onClick={handleSelectSnapshotFolder}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    ...
                  </button>
                </div>
              </div>

              {/* Save Copy */}
              <div className="flex flex-col space-y-3 pt-1 pb-2">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => {
                      setIsSaveCopyEnabled(!isSaveCopyEnabled);
                      localStorage.setItem('mystudio_save_copy', (!isSaveCopyEnabled).toString());
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${isSaveCopyEnabled ? 'bg-[#00B4FF]' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-transform duration-200 ease-in-out ${isSaveCopyEnabled ? 'translate-x-5 border-transparent' : 'translate-x-0 border border-slate-200'}`}></div>
                  </button>
                  <span className="text-[13px] text-slate-600">Save Copy</span>
                </div>
                
                {isSaveCopyEnabled && (
                  <div className="pl-[52px] flex flex-col space-y-3">
                    {copyPaths.map((path, idx) => (
                      <div key={idx} className="flex space-x-2">
                        <input 
                          type="text" 
                          value={path} 
                          readOnly
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-[13px] text-slate-600 focus:outline-none"
                        />
                        <button 
                          onClick={() => {
                            const newPaths = copyPaths.filter((_, i) => i !== idx);
                            setCopyPaths(newPaths);
                            localStorage.setItem('mystudio_copy_paths', JSON.stringify(newPaths));
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-500 hover:text-red-500 hover:bg-slate-50 transition-colors focus:outline-none"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={handleAddCopyPath}
                      className="flex items-center space-x-2 text-[#00B4FF] hover:text-[#0092cc] text-[13px] font-medium w-fit focus:outline-none"
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      <span>Add path</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Output File Naming */}
              <div className="space-y-2 pb-4">
                <label className="block text-[13px] font-semibold text-slate-500">Output File Naming</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="text" 
                    value={snapshotPrefix}
                    onChange={(e) => {
                      setSnapshotPrefix(e.target.value);
                      localStorage.setItem('mystudio_snapshot_prefix', e.target.value);
                    }}
                    className="w-[300px] px-3 py-1.5 bg-white border border-slate-300 rounded text-[13px] text-slate-600 focus:outline-none focus:border-[#00B4FF]"
                  />
                  <span className="text-[13px] text-slate-500">+ 1, 2, 3 ...</span>
                </div>
              </div>

              <div className="h-[1px] bg-slate-100 w-full mb-6 mt-2"></div>

              {/* Shutter Delay and Sound */}
              <div className="space-y-3">
                <label className="block text-[13px] font-semibold text-slate-500">Shutter Delay and Sound</label>
                <select 
                  value={shutterDelay}
                  onChange={(e) => {
                    setShutterDelay(parseInt(e.target.value, 10));
                    localStorage.setItem('mystudio_shutter_delay', e.target.value);
                  }}
                  className="w-[300px] px-3 py-1.5 bg-white border border-[#00B4FF] rounded text-[13px] text-slate-600 focus:outline-none"
                >
                  <option value={0}>Immediate</option>
                  <option value={3}>3 seconds</option>
                  <option value={5}>5 seconds</option>
                </select>

                <div className="flex items-center space-x-3 pt-4">
                  <button 
                    onClick={() => {
                      setPlayShutterSound(!playShutterSound);
                      localStorage.setItem('mystudio_shutter_sound', (!playShutterSound).toString());
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${playShutterSound ? 'bg-[#00B4FF]' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-transform duration-200 ease-in-out ${playShutterSound ? 'translate-x-5 border-transparent' : 'translate-x-0 border border-slate-200'}`}></div>
                  </button>
                  <span className="text-[13px] text-slate-600">Play shutter sound</span>
                </div>
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
        </div>
      </div>
    </div>
  );
};
