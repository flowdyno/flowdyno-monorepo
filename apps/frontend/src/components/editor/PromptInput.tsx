import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCanvasStore } from '../../stores/canvasStore';
import { generateArchitecture } from '../../services/aiService';
import { smartGraphLayout } from '../../utils/graphLayout';
import { useSettingsStore } from '../../stores/settingsStore';

interface PromptInputProps {
  onClose: () => void;
  initialPrompt?: string | null;
}

export default function PromptInput({ onClose, initialPrompt }: PromptInputProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const { loadData, recalculateFrames } = useCanvasStore();
  const { apiKeys, selectedProvider } = useSettingsStore();

  // Check if API key is configured
  const hasApiKey = apiKeys[selectedProvider];

  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const examples = [
    'Design an e-commerce system with User Service, Order Service, Payment Service, and Database',
    'Design a microservices architecture with API Gateway, Auth Service, and PostgreSQL',
    'Create a video streaming platform with CDN, Transcoding Service, Storage, and Cache',
    'Create a user login flowchart with input, form validation, database query, and response',
    'Create a user registration flowchart with email verification and database storage',
    'Design a frontend learning roadmap from HTML/CSS to JavaScript, React, and Next.js',
    'Design a backend learning roadmap from Python basics to Django, FastAPI, and databases',
  ];

  const doGenerate = async (inputPrompt: string) => {
    if (!inputPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateArchitecture({
        prompt: inputPrompt,
        complexity: 'detailed',
        maxNodes: 30,
      });

      // 检测图表类型
      const promptLower = prompt.toLowerCase();
      let diagramType: 'architecture' | 'flowchart' | 'roadmap' | undefined;
      if (promptLower.includes('流程') || promptLower.includes('flow')) {
        diagramType = 'flowchart';
      } else if (
        promptLower.includes('路线') ||
        promptLower.includes('学习') ||
        promptLower.includes('roadmap')
      ) {
        diagramType = 'roadmap';
      } else {
        diagramType = 'architecture';
      }

      // 过滤掉双向连接(只保留第一个方向)
      const seenEdges = new Set<string>();
      const cleanedConnections = result.connections.filter((conn) => {
        const key = [conn.from, conn.to].sort().join('-');
        if (seenEdges.has(key)) return false;
        seenEdges.add(key);
        return true;
      });

      // 应用智能布局算法优化节点位置
      const layoutedNodes = smartGraphLayout(result.nodes, cleanedConnections, diagramType);

      // 加载优化后的数据
      loadData(layoutedNodes, cleanedConnections);

      // 延时后重新计算 Frame 尺寸,确保子节点正确排列
      setTimeout(() => {
        recalculateFrames();
      }, 100);

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate architecture';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => doGenerate(prompt);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !autoTriggered) {
      setAutoTriggered(true);
      doGenerate(initialPrompt);
    }
  }, [initialPrompt, autoTriggered]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="relative max-w-3xl w-full">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue rounded-2xl blur-xl opacity-30" />

        {/* Modal Content */}
        <div className="relative bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                AI Generate Architecture
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Describe your architecture
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A microservices architecture with API gateway, user service, payment service, and PostgreSQL database..."
                  className="w-full h-36 px-4 py-3 bg-dark-900/50 border border-white/10 rounded-xl focus:outline-none focus:border-neon-purple/50 resize-none text-white placeholder-gray-500 text-base"
                  disabled={isGenerating}
                  autoFocus
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                  {prompt.length} characters
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Quick examples:</p>
              <div className="space-y-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(example)}
                    className="group w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-purple/50 rounded-xl text-sm text-gray-300 transition-all"
                    disabled={isGenerating}
                  >
                    <div className="flex items-center">
                      <span className="text-neon-purple mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                      <span>{example}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {!hasApiKey && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400 mb-2">API Key Required</p>
                    <p className="text-sm text-yellow-300/80 mb-3">
                      To use AI generation, please configure your {selectedProvider.toUpperCase()}{' '}
                      API key in Settings.
                    </p>
                    <button
                      onClick={() => router.push('/settings')}
                      className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-sm font-medium text-yellow-300 transition-all"
                    >
                      Go to Settings →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400 mb-1">Generation Failed</p>
                    <p className="text-sm text-red-300/80">{error}</p>
                    {error.includes('API key') && (
                      <button
                        onClick={() => router.push('/settings')}
                        className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm font-medium text-red-300 transition-all"
                      >
                        Configure API Key →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="text-sm">
                {isGenerating ? (
                  <span className="flex items-center text-neon-blue">
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating architecture...
                  </span>
                ) : (
                  <span className="text-gray-400">
                    💡 Tip: Be specific about services and technologies
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-sm font-medium"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="px-6 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                >
                  {isGenerating ? 'Generating...' : 'Generate ✨'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
