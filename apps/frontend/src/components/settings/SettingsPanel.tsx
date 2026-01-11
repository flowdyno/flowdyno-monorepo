import { X } from 'lucide-react';
import ApiKeySettings from './ApiKeySettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-dark-900 border-l border-white/10 shadow-2xl z-[9999] overflow-y-auto animate-in slide-in-from-right duration-300`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-xl border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <ApiKeySettings />
        </div>
      </div>
    </>
  );
}
