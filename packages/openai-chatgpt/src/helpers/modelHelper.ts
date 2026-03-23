import { CONFIG } from '../app/constants';
import { modelListSignal } from '../stores/useStore';
import { setStoredItem } from '../utilities/storage';

import type { ChatGPTModelsResponse } from '../app/types';

export async function fetchModels(): Promise<void> {
  try {
    const response = await fetch('https://chatgpt.com/backend-api/models', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: ChatGPTModelsResponse = await response.json();
    const models: Record<string, string> = {};

    if (data.models && Array.isArray(data.models)) {
      for (const model of data.models) {
        models[model.slug] = model.title;
      }
    }

    const mergedModels = { ...CONFIG.AVAILABLE_MODELS, ...models };
    modelListSignal.value = mergedModels;
    setStoredItem(CONFIG.MODEL_LIST_STORAGE_KEY, mergedModels);
  } catch (error) {
    console.error('Error fetching ChatGPT models:', error);
    modelListSignal.value = CONFIG.AVAILABLE_MODELS;
    setStoredItem(CONFIG.MODEL_LIST_STORAGE_KEY, CONFIG.AVAILABLE_MODELS);
  }
}
