import { useState } from 'react';
import { useSettingsStore, AIProvider } from '../../stores/settingsStore';

export default function ApiKeySettings() {
  const { apiKeys, selectedProvider, setApiKey, removeApiKey, setProvider } = useSettingsStore();
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    deepseek: false,
  });
  const [tempKeys, setTempKeys] = useState<Record<AIProvider, string>>({
    openai: apiKeys.openai || '',
    anthropic: apiKeys.anthropic || '',
    google: apiKeys.google || '',
    deepseek: apiKeys.deepseek || '',
  });

  const providers = [
    {
      id: 'openai' as AIProvider,
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5',
      placeholder: 'sk-...',
      docsUrl: 'https://platform.openai.com/api-keys',
    },
    {
      id: 'anthropic' as AIProvider,
      name: 'Anthropic',
      description: 'Claude 3 Opus, Sonnet, Haiku',
      placeholder: 'sk-ant-...',
      docsUrl: 'https://console.anthropic.com/account/keys',
    },
    {
      id: 'google' as AIProvider,
      name: 'Google AI',
      description: 'Gemini Pro, Gemini Ultra',
      placeholder: 'AIza...',
      docsUrl: 'https://makersuite.google.com/app/apikey',
    },
    {
      id: 'deepseek' as AIProvider,
      name: 'DeepSeek',
      description: 'DeepSeek Chat, DeepSeek Coder',
      placeholder: 'sk-...',
      docsUrl: 'https://platform.deepseek.com/api_keys',
    },
  ];

  const handleSave = (provider: AIProvider) => {
    const key = tempKeys[provider].trim();
    if (key) {
      setApiKey(provider, key);
    } else {
      removeApiKey(provider);
    }
  };

  const handleRemove = (provider: AIProvider) => {
    removeApiKey(provider);
    setTempKeys((prev) => ({ ...prev, [provider]: '' }));
  };

  const toggleShowKey = (provider: AIProvider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
          AI Provider Settings
        </h2>
        <p className="text-gray-400 text-sm">
          Configure your API keys to enable AI-powered diagram generation
        </p>
      </div>

      {/* Active Provider Selection */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
        <label className="block text-sm font-semibold text-gray-300 mb-3">Active AI Provider</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {providers.map((provider) => {
            const hasKey = !!apiKeys[provider.id];
            const isActive = selectedProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => hasKey && setProvider(provider.id)}
                disabled={!hasKey}
                className={`p-4 rounded-lg border transition-all text-left ${
                  isActive
                    ? 'bg-neon-purple/20 border-neon-purple'
                    : hasKey
                      ? 'bg-dark-700 border-dark-600 hover:border-dark-500'
                      : 'bg-dark-700/50 border-dark-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>{provider.name}</span>
                  {isActive && <span className="text-neon-purple text-xs">✓</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {hasKey ? 'Configured' : 'Not configured'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Keys Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-300">API Keys</h3>
        {providers.map((provider) => {
          const hasKey = !!apiKeys[provider.id];
          const isVisible = showKeys[provider.id];
          const displayValue = hasKey
            ? isVisible
              ? apiKeys[provider.id]
              : maskKey(apiKeys[provider.id] || '')
            : tempKeys[provider.id];

          return (
            <div key={provider.id} className="bg-dark-800 border border-dark-600 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-200">{provider.name}</h4>
                  <p className="text-sm text-gray-500">{provider.description}</p>
                </div>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neon-blue hover:underline"
                >
                  Get API Key →
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={displayValue}
                      onChange={(e) =>
                        setTempKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                      }
                      placeholder={provider.placeholder}
                      className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:outline-none focus:border-neon-purple text-sm"
                      disabled={hasKey && !isVisible}
                    />
                  </div>
                  {hasKey && (
                    <button
                      onClick={() => toggleShowKey(provider.id)}
                      className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg hover:border-dark-500 transition-colors text-sm"
                      title={isVisible ? 'Hide' : 'Show'}
                    >
                      {isVisible ? '🙈' : '👁️'}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {!hasKey || isVisible ? (
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={!tempKeys[provider.id].trim()}
                      className="px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-neon-purple/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasKey ? 'Update' : 'Save'}
                    </button>
                  ) : null}
                  {hasKey && (
                    <button
                      onClick={() => handleRemove(provider.id)}
                      className="px-4 py-2 bg-red-900/20 border border-red-500/50 rounded-lg text-sm font-semibold text-red-200 hover:bg-red-900/30 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {hasKey && (
                <div className="mt-3 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-green-200">
                    <span>✓</span>
                    <span>API key configured and ready to use</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-400 text-xl">ℹ️</span>
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">Your API keys are stored locally</p>
            <p className="text-blue-300/80">
              API keys are saved in your browser's local storage and never sent to our servers. They
              are only used to make direct requests to the AI provider's API from your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
