'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRESETS = [
  { id: 'northern-lights', name: 'Northern Lights', color1: '#8b5cf6', color2: '#06b6d4' },
  { id: 'ocean',           name: 'Ocean Deep',      color1: '#3b82f6', color2: '#06b6d4' },
  { id: 'sunset',          name: 'Sunset',          color1: '#f43f5e', color2: '#f59e0b' },
  { id: 'neon',            name: 'Neon',             color1: '#a855f7', color2: '#ec4899' },
  { id: 'forest',          name: 'Forest',           color1: '#10b981', color2: '#3b82f6' },
  { id: 'rose',            name: 'Rose',             color1: '#f472b6', color2: '#c084fc' },
  { id: 'ember',           name: 'Ember',            color1: '#ef4444', color2: '#f97316' },
  { id: 'arctic',          name: 'Arctic',           color1: '#67e8f9', color2: '#818cf8' },
];

const DEFAULTS = {
  preset: 'northern-lights',
  auroraColor1: '#8b5cf6',
  auroraColor2: '#06b6d4',
  auroraIntensity: 0.22,
  glassBlur: 24,
  reduceMotion: false,
};

const STORAGE_KEY = 'app-settings';

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

const SettingsContext = createContext(null);

const NOOP = () => {};
const FALLBACK = {
  settings: DEFAULTS,
  updateSettings: NOOP,
  applyPreset: NOOP,
  resetAllData: NOOP,
  openSettings: NOOP,
  closeSettings: NOOP,
  presets: PRESETS,
};

export function useSettings() {
  return useContext(SettingsContext) ?? FALLBACK;
}

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.style.setProperty('--aurora-1', hexToRgb(settings.auroraColor1));
    root.style.setProperty('--aurora-2', hexToRgb(settings.auroraColor2));
    root.style.setProperty('--aurora-intensity', String(settings.auroraIntensity));
    root.style.setProperty('--glass-blur', String(settings.glassBlur));
    root.style.setProperty('--reduce-motion', settings.reduceMotion ? '1' : '0');
  }, [settings, hydrated]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyPreset = useCallback((presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSettings((prev) => ({
      ...prev,
      preset: presetId,
      auroraColor1: preset.color1,
      auroraColor2: preset.color2,
    }));
  }, []);

  const resetAllData = useCallback(() => {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => localStorage.removeItem(key));
    setSettings(DEFAULTS);
    window.location.reload();
  }, []);

  const value = {
    settings,
    updateSettings,
    applyPreset,
    resetAllData,
    openSettings: () => setIsOpen(true),
    closeSettings: () => setIsOpen(false),
    presets: PRESETS,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
      {isOpen && <SettingsModal />}
    </SettingsContext.Provider>
  );
}

function SettingsModal() {
  const { settings, updateSettings, applyPreset, resetAllData, closeSettings, presets } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') closeSettings(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeSettings]);

  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={closeSettings}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-zen-100 glass-card rounded-2xl border border-zen-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-zen-800">Settings</h2>
          <button
            onClick={closeSettings}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zen-400 hover:text-zen-700 hover:bg-zen-200 transition"
            aria-label="Close settings"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Aurora Theme Presets */}
        <section className="mb-6">
          <label className="block text-sm font-medium text-zen-600 mb-3">Aurora Theme</label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => {
              const isActive = settings.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-xl p-2.5 border transition ${
                    isActive
                      ? 'border-zen-400 bg-zen-200'
                      : 'border-zen-200 hover:border-zen-300 hover:bg-zen-100'
                  }`}
                >
                  <div className="flex gap-1">
                    <span
                      className="w-5 h-5 rounded-full ring-1 ring-zen-300"
                      style={{ backgroundColor: preset.color1 }}
                    />
                    <span
                      className="w-5 h-5 rounded-full ring-1 ring-zen-300"
                      style={{ backgroundColor: preset.color2 }}
                    />
                  </div>
                  <span className="text-[10px] text-zen-500 group-hover:text-zen-700 leading-tight text-center">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Colors */}
        <section className="mb-6">
          <label className="block text-sm font-medium text-zen-600 mb-3">Custom Colors</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-zen-500 mb-1.5">Primary Glow</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.auroraColor1}
                  onChange={(e) => updateSettings({ auroraColor1: e.target.value, preset: 'custom' })}
                  className="w-10 h-10 rounded-lg border border-zen-300 bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                />
                <input
                  type="text"
                  value={settings.auroraColor1}
                  onChange={(e) => {
                    if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
                      updateSettings({ auroraColor1: e.target.value, preset: 'custom' });
                    }
                  }}
                  className="flex-1 rounded-lg border border-zen-300 bg-zen-100 px-2 py-1.5 text-xs text-zen-700 font-mono focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-zen-500 mb-1.5">Secondary Glow</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.auroraColor2}
                  onChange={(e) => updateSettings({ auroraColor2: e.target.value, preset: 'custom' })}
                  className="w-10 h-10 rounded-lg border border-zen-300 bg-transparent cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                />
                <input
                  type="text"
                  value={settings.auroraColor2}
                  onChange={(e) => {
                    if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
                      updateSettings({ auroraColor2: e.target.value, preset: 'custom' });
                    }
                  }}
                  className="flex-1 rounded-lg border border-zen-300 bg-zen-100 px-2 py-1.5 text-xs text-zen-700 font-mono focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Aurora Intensity */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zen-600">Aurora Intensity</label>
            <span className="text-xs text-zen-500 font-mono">{Math.round(settings.auroraIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.50"
            step="0.01"
            value={settings.auroraIntensity}
            onChange={(e) => updateSettings({ auroraIntensity: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-zen-300 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-matcha-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-matcha-500/30"
          />
        </section>

        {/* Glass Blur */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-zen-600">Glass Blur</label>
            <span className="text-xs text-zen-500 font-mono">{settings.glassBlur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="48"
            step="1"
            value={settings.glassBlur}
            onChange={(e) => updateSettings({ glassBlur: parseInt(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-zen-300 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-matcha-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-matcha-500/30"
          />
        </section>

        {/* Reduce Motion */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zen-600">Reduce Motion</label>
              <p className="text-xs text-zen-400 mt-0.5">Disable aurora background animation</p>
            </div>
            <button
              onClick={() => updateSettings({ reduceMotion: !settings.reduceMotion })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                settings.reduceMotion ? 'bg-matcha-500' : 'bg-zen-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-6 border-t border-zen-200">
          <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
          <p className="text-xs text-zen-500 mb-3">
            Clear all saved data including notes, chat history, cart contents, and settings. This cannot be undone.
          </p>
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400 font-medium">Are you sure?</span>
              <button
                onClick={resetAllData}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition"
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg bg-zen-200 text-zen-600 text-xs font-medium hover:bg-zen-300 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition"
            >
              Clear All App Data
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
