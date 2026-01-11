import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'deepseek';

interface SettingsState {
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
    deepseek?: string;
  };
  selectedProvider: AIProvider;
  setApiKey: (provider: AIProvider, key: string) => void;
  removeApiKey: (provider: AIProvider) => void;
  setProvider: (provider: AIProvider) => void;
  getApiKey: (provider?: AIProvider) => string | undefined;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      selectedProvider: 'openai',

      setApiKey: (provider, key) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        })),

      removeApiKey: (provider) =>
        set((state) => {
          const newKeys = { ...state.apiKeys };
          delete newKeys[provider];
          return { apiKeys: newKeys };
        }),

      setProvider: (provider) => set({ selectedProvider: provider }),

      getApiKey: (provider) => {
        const state = get();
        const targetProvider = provider || state.selectedProvider;
        return state.apiKeys[targetProvider];
      },
    }),
    {
      name: 'flowdyno-settings',
    }
  )
);
