import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { Network } from 'lucide-react';

export default function Toolbar() {
  const { tool, setTool, showGrid, toggleGrid } = useEditorStore();
  const applySmartLayout = useCanvasStore((state) => state.applySmartLayout);
  const nodes = useCanvasStore((state) => state.nodes);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) {
      return;
    }
    applySmartLayout();
  }, [nodes.length, applySmartLayout]);

  // 监听键盘事件: 按住 Space 切换到 Pan, 松开恢复 Select; L 触发 Auto Layout
  useEffect(() => {
    let isSpacePressed = false;
    let previousTool: 'pointer' | 'hand' = 'pointer';

    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框中,不处理
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // 按住 Space 键切换到 Pan
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        isSpacePressed = true;
        previousTool = useEditorStore.getState().tool as 'pointer' | 'hand';
        setTool('hand');
      }

      // L 键触发 Auto Layout
      if (e.code === 'KeyL') {
        e.preventDefault();
        handleAutoLayout();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 松开 Space 键恢复之前的工具
      if (e.code === 'Space' && isSpacePressed) {
        e.preventDefault();
        isSpacePressed = false;
        setTool(previousTool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setTool, handleAutoLayout]);

  const tools = [
    { id: 'pointer', icon: '👆', label: 'Select (V)', shortcut: 'V' },
    { id: 'hand', icon: '✋', label: 'Pan (Space)', shortcut: 'Space' },
  ];

  return (
    <div className="flex flex-col items-center py-6 space-y-3">
      {/* Tools */}
      <div className="space-y-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id as any)}
            className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              tool === t.id
                ? 'bg-gradient-to-br from-neon-purple to-neon-blue shadow-lg shadow-neon-purple/30'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
            title={t.label}
          >
            <span className="text-xl">{t.icon}</span>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {t.label}
            </div>
          </button>
        ))}
      </div>

      <div className="w-8 h-px bg-white/10 my-2" />

      {/* View Options */}
      <div className="space-y-2">
        <button
          onClick={toggleGrid}
          className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            showGrid
              ? 'bg-neon-blue/20 border border-neon-blue'
              : 'bg-white/5 hover:bg-white/10 border border-white/10'
          }`}
          title="Toggle Grid (G)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
          <div className="absolute left-full ml-3 px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Toggle Grid
          </div>
        </button>

        {/* Auto Layout Button */}
        <button
          onClick={handleAutoLayout}
          className="group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-purple"
          title="Auto Layout (L)"
        >
          <Network className="w-5 h-5" />
          <div className="absolute left-full ml-3 px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Auto Layout
          </div>
        </button>
      </div>
    </div>
  );
}
