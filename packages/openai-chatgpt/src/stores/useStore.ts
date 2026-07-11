import { signal } from '@preact/signals';

import { CONFIG } from '../app/constants';
import { getStoredItem } from '../utilities/storage';

const prompts = getStoredItem<Record<string, string>>(CONFIG.PROMPT_STORAGE_KEY, {});
const initialModelId = getStoredItem<string>(CONFIG.MODEL_STORAGE_KEY, CONFIG.DEFAULT_MODEL_ID);
const initialModelList = getStoredItem<string[]>(CONFIG.MODEL_LIST_STORAGE_KEY, CONFIG.AVAILABLE_MODELS as unknown as string[]);
const initialSystemPrompt = prompts[window.location.pathname] || prompts['/'] || '';

export const modelIdSignal = signal<string>(initialModelId);
export const modelListSignal = signal<string[]>(initialModelList);
export const systemPromptSignal = signal<string>(initialSystemPrompt);
