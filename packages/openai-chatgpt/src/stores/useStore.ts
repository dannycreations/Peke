import { signal } from '@preact/signals';

import { CONFIG } from '../app/constants';
import { getStoredItem } from '../utilities/storage';

const initialModelId = getStoredItem<string>(CONFIG.MODEL_STORAGE_KEY, CONFIG.DEFAULT_MODEL_ID);
const prompts = getStoredItem<Record<string, string>>(CONFIG.PROMPT_STORAGE_KEY, {});
const currentPath = window.location.pathname;
const initialSystemPrompt = prompts[currentPath] || prompts['/'] || '';

export const modelIdSignal = signal<string>(initialModelId);
export const systemPromptSignal = signal<string>(initialSystemPrompt);
