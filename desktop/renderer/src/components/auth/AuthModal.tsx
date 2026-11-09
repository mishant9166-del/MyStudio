import React, { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: (user: { name: string, email?: string, phone?: string, user_id?: string }) => void;
}

export const AuthModal: React.FC<Props> = ({ onClose, initialMode = 'signup', onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [keepUpdated, setKeepUpdated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmailError('');
  };

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
        setGeneralError('Authentication failed');
        window.removeEventListener('message', messageListener);
      }
    };
    window.addEventListener('message', messageListener);
  };

  const Logo = () => (
    <div className="flex items-center space-x-2">
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Simple approximation of the logo */}
        <div className="absolute w-8 h-8 bg-[#fcd53f] rounded-full opacity-80" style={{ transform: 'translate(-4px, -2px)' }}></div>
        <div className="absolute w-8 h-8 bg-[#00d084] rounded-full opacity-80" style={{ transform: 'translate(4px, 2px)' }}></div>
        <div className="absolute w-8 h-8 bg-[#00a9eb] rounded-full opacity-90"></div>
        <div className="absolute w-3 h-3 bg-white rounded-full"></div>
      </div>
      <span className="text-2xl font-bold tracking-tight text-slate-800">mystudio</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white w-[320px] rounded-lg shadow-2xl relative flex flex-col p-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <h2 className="text-[13px] text-slate-600 text-center mb-4 font-medium">
          {mode === 'login' 
            ? 'Log in to link your devices to your MyStudio Account' 
            : 'Sign up to link your devices to your MyStudio Account.'}
        </h2>

        {mode === 'login' && (
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Use existing account</label>
            <div className="flex justify-between space-x-2">
              <button onClick={() => handleOAuth('facebook')} className="flex-1 flex items-center justify-center space-x-1.5 bg-[#3b5998] hover:bg-[#2d4373] text-white rounded py-1.5 transition-colors">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span className="text-[11px] font-medium">Facebook</span>
              </button>
              <button onClick={() => handleOAuth('twitter')} className="flex-1 flex items-center justify-center space-x-1.5 bg-[#00aced] hover:bg-[#008fca] text-white rounded py-1.5 transition-colors">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                <span className="text-[11px] font-medium">Twitter</span>
              </button>
              <button onClick={() => handleOAuth('google')} className="flex-1 flex items-center justify-center space-x-1.5 bg-[#5484ea] hover:bg-[#3d6ed7] text-white rounded py-1.5 transition-colors">
                <div className="bg-white p-0.5 rounded-sm flex items-center justify-center">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24"><path d="M23.49 12.275c0-.79-.07-1.54-.19-2.275H12v4.51h6.476a5.556 5.556 0 01-2.413 3.64v3.013h3.9c2.285-2.106 3.601-5.207 3.601-8.628z" fill="#4285F4"/><path d="M12 24c3.24 0 5.95-1.076 7.925-2.915l-3.9-3.012c-1.08.723-2.454 1.15-4.025 1.15-3.09 0-5.712-2.087-6.643-4.896H1.31v3.111C3.284 21.365 7.29 24 12 24z" fill="#34A853"/><path d="M5.357 14.327a7.2 7.2 0 01-.378-2.327c0-.81.14-1.59.378-2.327V6.562H1.31A11.968 11.968 0 000 12c0 1.93.456 3.754 1.25 5.378l4.107-3.051z" fill="#FBBC05"/><path d="M12 4.776c1.76 0 3.34.606 4.584 1.79l3.44-3.44C17.946 1.19 15.236 0 12 0 7.29 0 3.284 2.635 1.31 6.562l4.047 3.11C6.288 6.863 8.91 4.776 12 4.776z" fill="#EA4335"/></svg>
                </div>
                <span className="text-[11px] font-medium">Google</span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {mode === 'signup' && (
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">First name</label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-[#20c0f3] placeholder-slate-400 transition-colors" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Last name</label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-[#20c0f3] placeholder-slate-400 transition-colors" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
                if (generalError) setGeneralError('');
              }}
              placeholder="E-mail"
              className={`w-full bg-white border rounded px-2.5 py-1.5 text-[11px] text-slate-700 outline-none transition-colors placeholder-slate-400
                ${emailError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-[#20c0f3]'}
              `} 
            />
            {emailError && (
              <div className="text-red-500 text-[10px] mt-1">{emailError}</div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-[#20c0f3] placeholder-slate-400 transition-colors" 
            />
            {mode === 'login' && (
              <div className="flex justify-end mt-1.5">
                <button className="text-[#20c0f3] hover:text-[#0b98c5] text-[10px] font-medium">Password recovery</button>
              </div>
            )}
          </div>

          {mode === 'signup' && (
              <label className="flex items-start space-x-2 mt-3 cursor-pointer group">
              <div className={`mt-0.5 w-6 h-3 rounded-full relative transition-colors ${keepUpdated ? 'bg-[#20c0f3]' : 'bg-slate-300'}`}>
                <div className={`absolute top-0.5 left-0.5 bg-white w-2 h-2 rounded-full transition-transform ${keepUpdated ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
              <input type="checkbox" className="hidden" checked={keepUpdated} onChange={() => setKeepUpdated(!keepUpdated)} />
              <span className="text-[11px] text-slate-500 leading-tight">
                Keep me updated with MyStudio news and promotions
              </span>
            </label>
          )}
        </div>
        
        {generalError && (
          <div className="mt-4 text-center text-red-500 text-[11px] font-medium bg-red-50 p-2 rounded border border-red-100">
            {generalError}
          </div>
        )}

        <div className="mt-5">
          <button 
            disabled={loading}
            onClick={async () => {
              if (loading) return;
              try {
                setLoading(true);
                setGeneralError('');
                
                if (mode === 'signup') {
                  const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'New User';
                  const res = await fetch('http://localhost:3001/v1/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name })
                  });
                  const data = await res.json();
                  if (!res.ok || data.error) {
                    setGeneralError(data.error || 'Registration failed');
                  } else {
                    onSuccess?.({ name, email, phone: data.phone, user_id: data.user_id });
                  }
                } else {
                  const res = await fetch('http://localhost:3001/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email_or_phone: email, password })
                  });
                  const data = await res.json();
                  if (!res.ok || data.error) {
                    setGeneralError(data.error || 'Login failed');
                  } else {
                    onSuccess?.({ name: data.name, email: data.email || email, phone: data.phone, user_id: data.user_id });
                  }
                }
              } catch (err: any) {
                setGeneralError('Network error. Is the admin server running on port 3001?');
              } finally {
                setLoading(false);
              }
            }}
            className={`w-full text-white rounded py-1.5 text-[12px] font-medium transition-colors flex items-center justify-center space-x-2 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#30c4f8] hover:bg-[#20b4e8]'}`}
          >
            {loading && <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            <span>{loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Sign Up')}</span>
          </button>
          
          {mode === 'signup' && (
            <p className="text-[10px] text-slate-500 text-center mt-2.5 px-2 leading-relaxed">
              Choosing <span className="font-semibold text-slate-600">Sign Up</span> means that you agree to the <button className="text-[#20c0f3] hover:underline">MyStudio Terms of Service Agreement</button> and <button className="text-[#20c0f3] hover:underline">Privacy Policy</button>.
            </p>
          )}
        </div>

        <div className="mt-6 pt-3 text-center">
          <div className="text-[11px] text-slate-500 mb-1.5 flex items-center justify-center space-x-1.5">
            <span>
              {mode === 'login' ? "Don't have an account yet?" : "Already have an account?"}
            </span>
            <button 
              onClick={() => {
                setGeneralError('');
                setEmailError('');
                handleToggleMode();
              }}
              className="text-[#20c0f3] hover:text-[#0b98c5] font-medium"
            >
              {mode === 'login' ? "Create one now!" : "Log In"}
            </button>
          </div>
          
          {/* {mode === 'signup' && (
            <button className="text-[#20c0f3] hover:text-[#0b98c5] text-[11px] font-medium mt-1">
              Continue as a Guest
            </button>
          )} */}
        </div>

      </div>
    </div>
  );
};
