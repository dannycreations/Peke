import { signal } from '@preact/signals';

import { CONFIG } from '../app/constants';
import { getCurrentPath } from '../helpers/locationHelper';
import { readPromptStore, resolvePrompt } from '../helpers/promptHelper';
import { isStringList } from '../utilities/common';
import { getStoredItem } from '../utilities/storage';

const storedModelId = getStoredItem<unknown>(CONFIG.MODEL_STORAGE_KEY, CONFIG.DEFAULT_MODEL_ID);
const storedModelList = getStoredItem<unknown>(CONFIG.MODEL_LIST_STORAGE_KEY, CONFIG.AVAILABLE_MODELS);

export const modelIdSignal = signal<string>(typeof storedModelId === 'string' && storedModelId.trim() ? storedModelId : CONFIG.DEFAULT_MODEL_ID);
export const modelListSignal = signal<string[]>(isStringList(storedModelList) ? storedModelList : [...CONFIG.AVAILABLE_MODELS]);
export const systemPromptSignal = signal<string>(resolvePrompt(readPromptStore(), getCurrentPath()));
