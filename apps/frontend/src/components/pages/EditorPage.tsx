import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactFlowCanvas from '../canvas/ReactFlowCanvas';
import Toolbar from '../editor/Toolbar';
import NodePalette from '../editor/NodePalette';
import PropertyPanel from '../editor/PropertyPanel';
import PromptInput from '../editor/PromptInput';
import ExportModal from '../export/ExportModal';
import ImportModal from '../import/ImportModal';
import UserPlanBadge from '../editor/UserPlanBadge';
import SettingsPanel from '../settings/SettingsPanel';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAnimationStore } from '../../stores/animationStore';
import { useReactFlowStore } from '../../stores/reactFlowStore';

export default function EditorPage() {
  const router = useRouter();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const { nodes, clearCanvas, loadData } = useCanvasStore();
  const { play, updateSettings } = useAnimationStore();
  const { fitView } = useReactFlowStore();

  const handleImport = (data: { nodes: any[]; connections: any[]; animationSettings?: any }) => {
    loadData(data.nodes, data.connections);
    if (data.animationSettings) {
      updateSettings(data.animationSettings);
    }
    setShowPromptInput(false);
    setTimeout(() => {
      if (data.animationSettings?.loop) {
        play();
      }
    }, 500);
  };

  useEffect(() => {
    const loadTemplate = async () => {
      const { template, prompt } = router.query;

      // 如果有 template 参数，立即隐藏弹窗
      if (template) {
        setShowPromptInput(false);
      }

      if (template && typeof template === 'string') {
        try {
          // Add cache busting parameter to force reload
          const templateUrl = `${template}?t=${Date.now()}`;
          const response = await fetch(templateUrl, {
            cache: 'no-store', // Disable browser cache
          });
          if (!response.ok) throw new Error('Failed to load template');
          const templateData = await response.json();
          loadData(templateData.nodes, templateData.connections);

          if (templateData.animationSettings) {
            updateSettings(templateData.animationSettings);
          }

          setShowPromptInput(false);

          setTimeout(() => {
            if (templateData.animationSettings?.loop) {
              play();
            }
          }, 500);
        } catch (error) {
          console.error('Error loading template:', error);
        }
      } else if (prompt && typeof prompt === 'string') {
        setInitialPrompt(prompt);
        setShowPromptInput(true);
      }
    };

    if (router.isReady) {
      loadTemplate();
    }
  }, [router.isReady, router.query, loadData, play, updateSettings, fitView]);

  return (
    <div className="h-screen flex flex-col bg-dark-900 relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />
      </div>

      {/* Top Bar */}
      <div className="relative z-[10] h-16 bg-dark-800/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <a href="/" className="flex items-center space-x-3 group">
            <img src="/logo.svg" alt="FlowDyno" className="w-8 h-8" />
            <span className="font-bold bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              FlowDyno
            </span>
          </a>
        </div>

        <div className="flex items-center space-x-3">
          <UserPlanBadge />

          <button
            onClick={() => setShowPromptInput(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-purple/40 transition-all text-sm transform hover:scale-105"
          >
            ✨ AI Generate
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all text-sm"
          >
            📥 Import
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={nodes.length === 0}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📦 Export
          </button>
          {nodes.length > 0 && (
            <button
              onClick={clearCanvas}
              className="px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all text-sm"
              title="Clear Canvas"
            >
              🗑️
            </button>
          )}

          <div className="h-6 w-px bg-white/10" />

          <button
            onClick={() => setShowSettingsPanel(true)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm flex items-center gap-2"
            title="API Key Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left Sidebar - Toolbar */}
        <div className="w-20 bg-dark-800/50 backdrop-blur-sm border-r border-white/5">
          <Toolbar />
        </div>

        {/* Node Palette */}
        <div className="w-64 bg-dark-800/50 backdrop-blur-sm border-r border-white/5">
          <NodePalette />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-dark-900/50">
          <ReactFlowCanvas />

          {/* Empty State */}
          {nodes.length === 0 && !showPromptInput && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-md">
                <div className="relative inline-block mb-6">
                  <div className="text-8xl">🎨</div>
                  <div className="absolute inset-0 blur-2xl opacity-50">🎨</div>
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                  Ready to Create?
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Click "AI Generate" to create a diagram from text
                  <br />
                  or drag nodes from the left panel
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded">Space</kbd>
                    <span>Pan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded">
                      Scroll
                    </kbd>
                    <span>Zoom</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-96 bg-dark-800/50 backdrop-blur-sm border-l border-white/5 overflow-y-auto">
          <PropertyPanel />
        </div>
      </div>

      {/* Modals */}
      {showPromptInput && (
        <PromptInput onClose={() => setShowPromptInput(false)} initialPrompt={initialPrompt} />
      )}

      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImport} />
      )}

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettingsPanel} onClose={() => setShowSettingsPanel(false)} />
    </div>
  );
}
