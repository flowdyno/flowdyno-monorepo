import { useCanvasStore } from '../../stores/canvasStore';
import { useEditorStore } from '../../stores/editorStore';
import { CONNECTION_COLORS } from '@flowdyno/shared-config';

export default function ConnectionPanel() {
  const {
    nodes,
    connections,
    selectedConnectionId,
    updateConnection,
    deleteConnection,
    setSelectedConnection,
  } = useCanvasStore();
  useEditorStore();

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  const handleLineStyleChange = (lineStyle: 'solid' | 'dashed') => {
    if (selectedConnection) {
      updateConnection(selectedConnection.id, { lineStyle });
    }
  };

  const handleEdgeTypeChange = (edgeType: 'smoothstep' | 'bezier') => {
    if (selectedConnection) {
      updateConnection(selectedConnection.id, { edgeType });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedConnection) {
      updateConnection(selectedConnection.id, { color });
    }
  };

  const handleShowLabelChange = (showLabel: boolean) => {
    if (selectedConnection) {
      updateConnection(selectedConnection.id, { showLabel });
    }
  };

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? node.label : nodeId;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold mb-4 bg-gradient-to-r from-neon-blue to-neon-green bg-clip-text text-transparent flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-neon-blue"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Connections
        </h3>
      </div>

      {/* Selected Connection Editor */}
      {selectedConnection ? (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-white">Edit Connection</div>
            <button
              onClick={() => setSelectedConnection(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400 mb-4">
            <span>{getNodeLabel(selectedConnection.from)}</span>
            <span className="text-neon-blue">→</span>
            <span>{getNodeLabel(selectedConnection.to)}</span>
          </div>

          {/* Label Input */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Label</label>
            <input
              type="text"
              value={selectedConnection.label || ''}
              onChange={(e) => updateConnection(selectedConnection.id, { label: e.target.value })}
              placeholder="Enter connection label..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-neon-blue transition-colors"
            />
          </div>

          {/* Line Style Selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Line Style</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLineStyleChange('solid')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  (selectedConnection.lineStyle || 'solid') === 'solid'
                    ? 'border-neon-blue bg-neon-blue/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-medium mb-2">Solid</div>
                <div className="h-0.5 bg-current"></div>
              </button>
              <button
                onClick={() => handleLineStyleChange('dashed')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedConnection.lineStyle === 'dashed'
                    ? 'border-neon-blue bg-neon-blue/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-medium mb-2">Dashed</div>
                <div className="h-0.5 border-t-2 border-dashed border-current"></div>
              </button>
            </div>
          </div>

          {/* Edge Type Selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Edge Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleEdgeTypeChange('smoothstep')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  (selectedConnection.edgeType || 'smoothstep') === 'smoothstep'
                    ? 'border-neon-green bg-neon-green/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-medium mb-2">Right Angle</div>
                <svg className="w-full h-6" viewBox="0 0 60 24" fill="none" stroke="currentColor">
                  <path d="M 0 12 L 20 12 L 20 6 L 40 6 L 40 18 L 60 18" strokeWidth="2" />
                </svg>
              </button>
              <button
                onClick={() => handleEdgeTypeChange('bezier')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedConnection.edgeType === 'bezier'
                    ? 'border-neon-green bg-neon-green/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="text-xs font-medium mb-2">Bezier Curve</div>
                <svg className="w-full h-6" viewBox="0 0 60 24" fill="none" stroke="currentColor">
                  <path d="M 0 12 Q 15 12 20 6 T 40 18 Q 50 18 60 18" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {CONNECTION_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => handleColorChange(colorOption.value)}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    (selectedConnection.color || '#00f0ff') === colorOption.value
                      ? 'border-white bg-white/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  title={colorOption.name}
                >
                  <div
                    className="w-full h-6 rounded"
                    style={{
                      backgroundColor: colorOption.value,
                      boxShadow: `0 0 8px ${colorOption.value}`,
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="color"
                value={selectedConnection.color || '#00f0ff'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-gray-400">Custom Color</span>
            </div>
          </div>

          {/* Show Label Toggle */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-400">Show Label</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedConnection.showLabel !== false}
                  onChange={(e) => handleShowLabelChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
              </div>
            </label>
          </div>

          {/* Glow Effect Toggle */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-400">Glow Effect</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedConnection.glowEnabled !== false}
                  onChange={(e) =>
                    updateConnection(selectedConnection.id, { glowEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
              </div>
            </label>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
          <div className="text-4xl mb-3 opacity-50">👇</div>
          <p className="text-gray-400 text-sm">Select a connection below to edit its style</p>
        </div>
      )}

      {/* Connection List */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-400">
          All Connections ({connections.length})
        </div>

        {connections.length > 0 ? (
          <div className="space-y-2 overflow-y-auto">
            {connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => setSelectedConnection(conn.id)}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer group ${
                  selectedConnectionId === conn.id
                    ? 'border-neon-blue bg-neon-blue/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-white flex items-center space-x-1">
                    <span className="text-gray-300">{getNodeLabel(conn.from)}</span>
                    <span className="text-neon-blue">→</span>
                    <span className="text-gray-300">{getNodeLabel(conn.to)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConnection(conn.id);
                      if (selectedConnectionId === conn.id) {
                        setSelectedConnection(null);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                    title="Delete connection"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* Connection Style Info */}
                <div className="flex items-center space-x-3 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span>Style:</span>
                    <span className="text-neon-blue capitalize">{conn.lineStyle || 'solid'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <span>Type:</span>
                    <span className="text-neon-green capitalize">
                      {conn.edgeType === 'smoothstep' ? 'Right Angle' : 'Bezier'}
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{
                        backgroundColor: conn.color || '#00f0ff',
                        boxShadow: `0 0 6px ${conn.color || '#00f0ff'}`,
                      }}
                    />
                  </div>
                </div>

                {conn.label && <div className="text-xs text-gray-500 mt-1">{conn.label}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="text-3xl mb-2 opacity-50">🔗</div>
            <p className="text-xs text-gray-400">No connections yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Drag from a node's connection point to another node
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
