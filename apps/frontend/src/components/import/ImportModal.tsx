import { useState } from 'react';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: { nodes: any[]; connections: any[]; animationSettings?: any }) => void;
}

export default function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');

  const handlePaste = () => {
    setError(null);
    try {
      const data = JSON.parse(jsonText);

      if (!data.nodes || !data.connections) {
        throw new Error('Invalid FlowDyno JSON: missing nodes or connections');
      }

      onImport({
        nodes: data.nodes,
        connections: data.connections,
        animationSettings: data.animationSettings,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.nodes || !data.connections) {
        throw new Error('Invalid FlowDyno JSON: missing nodes or connections');
      }

      onImport({
        nodes: data.nodes,
        connections: data.connections,
        animationSettings: data.animationSettings,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-blue">📥 Import Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 border-b border-dark-600">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'paste'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Paste JSON
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'file'
                ? 'text-neon-blue border-b-2 border-neon-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📁 Upload File
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'paste' ? (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Paste your FlowDyno JSON here:
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{"version":"1.0.0","nodes":[...],"connections":[...]}'
                className="w-full h-64 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-neon-blue resize-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Select a FlowDyno JSON file:
              </label>
              <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-neon-blue transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="text-6xl">📁</div>
                  <div className="text-white font-semibold">Click to select file</div>
                  <div className="text-sm text-gray-400">or drag and drop</div>
                  <div className="text-xs text-gray-500">Supports .json files</div>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-500">❌</span>
                <div className="text-sm text-red-200">{error}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dark-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'paste' && (
              <button
                onClick={handlePaste}
                disabled={!jsonText.trim()}
                className="px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded font-semibold hover:shadow-lg hover:shadow-neon-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
