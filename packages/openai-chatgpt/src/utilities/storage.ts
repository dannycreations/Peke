import { useStorage } from '@/hooks/useStorage';

import { CONFIG } from '../app/constants';

const storageUtil = useStorage();

export function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const storedItem = storageUtil.getItem(key);
    if (storedItem) {
      const parsed = JSON.parse(storedItem);

      // Validation for model store
      if (key === CONFIG.MODEL_STORAGE_KEY) {
        if (typeof parsed !== 'string' || !(parsed in CONFIG.AVAILABLE_MODELS)) {
          storageUtil.removeItem(key);
          return defaultValue;
        }
      }

      // Validation for prompt store
      if (key === CONFIG.PROMPT_STORAGE_KEY && (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null)) {
        storageUtil.removeItem(key);
        return defaultValue;
      }

      return parsed as T;
    }
  } catch (error) {
    console.error(`Error parsing item from localStorage for key "${key}":`, error);
    storageUtil.removeItem(key);
  }
  return defaultValue;
}

export function setStoredItem<T>(key: string, value: T): void {
  try {
    storageUtil.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item to localStorage for key "${key}":`, error);
  }
}
