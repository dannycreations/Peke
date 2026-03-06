import { create } from 'zustand';

import { CONFIG } from '../app/constants';
import { getStoredItem } from '../utilities/storage';

interface AppState {
  readonly modelId: string;
  readonly systemPrompt: string;
  readonly setModelId: (id: string) => void;
  readonly setSystemPrompt: (prompt: string) => void;
}

export const useStore = create<AppState>((set) => {
  const initialModelId = getStoredItem<string>(CONFIG.MODEL_STORAGE_KEY, CONFIG.DEFAULT_MODEL_ID);

  const prompts = getStoredItem<Record<string, string>>(CONFIG.PROMPT_STORAGE_KEY, {});
  const currentPath = window.location.pathname;
  const initialSystemPrompt = prompts[currentPath] || prompts['/'] || '';

  return {
    modelId: initialModelId,
    systemPrompt: initialSystemPrompt,
    setModelId: (id: string) => set({ modelId: id }),
    setSystemPrompt: (prompt: string) => set({ systemPrompt: prompt }),
  };
});
