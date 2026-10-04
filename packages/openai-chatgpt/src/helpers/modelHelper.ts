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
  const fallback: string[] = [...CONFIG.AVAILABLE_MODELS];
  let modelList = fallback;

  try {
    const response = await fetch('https://chatgpt.com/backend-api/models', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: ChatGPTModelsResponse = await response.json();
    const slugs = Array.isArray(data.models) ? data.models.map((model) => model.slug) : [];
    modelList = Array.from(new Set([...fallback, ...slugs]));
  } catch (error) {
    console.error('Error fetching ChatGPT models:', error);
  }

  modelListSignal.value = modelList;
  setStoredItem(CONFIG.MODEL_LIST_STORAGE_KEY, modelList);
}
