import React, { useState } from 'react';
import { X, Settings, Key, Server, Cpu, Database } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rr_anthropic_api_key') || '');
  const [proxyUrl, setProxyUrl] = useState(() => localStorage.getItem('rr_proxy_url') || 'http://localhost:3001');
  const [useLocalOnly, setUseLocalOnly] = useState(() => localStorage.getItem('rr_use_local_only') === 'true');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('rr_anthropic_api_key', apiKey);
    localStorage.setItem('rr_proxy_url', proxyUrl);
    localStorage.setItem('rr_use_local_only', useLocalOnly ? 'true' : 'false');
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#0F0F16] border-t border-neutral-800 rounded-t-3xl p-6 shadow-2xl transition-transform animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-lg text-white">Developer Settings</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Summary Engine Mode
            </label>
            <div className="grid grid-cols-2 gap-2 bg-neutral-900/50 p-1 rounded-xl border border-neutral-850">
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  useLocalOnly 
                    ? 'bg-neutral-800 text-white' 
                    : 'text-neutral-450 hover:text-white'
                }`}
                onClick={() => setUseLocalOnly(true)}
              >
                Local Heuristic (Free)
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  !useLocalOnly 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-neutral-450 hover:text-white'
                }`}
                onClick={() => setUseLocalOnly(false)}
              >
                Claude AI (API Key)
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
              {useLocalOnly 
                ? "🚀 Runs instant heuristic NLP summaries locally. No server, key, or internet charges required." 
                : "🧠 Communicates with Claude 3.5 Sonnet to generate high-fidelity scientific TL;DRs and findings."
              }
            </p>
          </div>

          {!useLocalOnly && (
            <>
              {/* Anthropic Key */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Anthropic API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 text-[10px] uppercase font-bold text-neutral-400 hover:text-indigo-400"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-500 leading-snug">
                  Key is saved locally in your browser storage and passed to the proxy server securely.
                </p>
              </div>

              {/* Local Proxy URL */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> Proxy Server URL
                </label>
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-neutral-500 leading-snug">
                  Required to forward requests to Anthropic and bypass browser CORS limits.
                </p>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className={`w-full py-3 rounded-xl font-semibold text-xs text-center transition-all duration-300 ${
                saved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-600/25 cursor-pointer'
              }`}
            >
              {saved ? '✓ Settings Saved' : 'Save Configurations'}
            </button>
            
            <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-2 px-1">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-neutral-500" /> App Version v1.0.0 (MVP)
              </span>
              <button 
                onClick={() => {
                  if(confirm("Clear cache and bookmarks?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Reset All Cache
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
