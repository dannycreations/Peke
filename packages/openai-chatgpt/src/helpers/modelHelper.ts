import { CONFIG } from '../app/constants';
import { modelListSignal } from '../stores/useStore';
import { setStoredItem } from '../utilities/storage';

import type { ChatGPTModelsResponse } from '../app/types';

export function formatModelId(id: string): string {
  if (!id) return id;
  return id
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function fetchModels(): Promise<void> {
  try {
    const response = await fetch('https://chatgpt.com/backend-api/models', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: ChatGPTModelsResponse = await response.json();
    const models: string[] = [];

    if (data.models && Array.isArray(data.models)) {
      for (const model of data.models) {
        models.push(model.slug);
      }
    }

    const mergedList = Array.from(new Set([...CONFIG.AVAILABLE_MODELS, ...models]));
    modelListSignal.value = mergedList;
    setStoredItem(CONFIG.MODEL_LIST_STORAGE_KEY, mergedList);
  } catch (error) {
    console.error('Error fetching ChatGPT models:', error);
    modelListSignal.value = [...CONFIG.AVAILABLE_MODELS];
    setStoredItem(CONFIG.MODEL_LIST_STORAGE_KEY, [...CONFIG.AVAILABLE_MODELS]);
  }
}
