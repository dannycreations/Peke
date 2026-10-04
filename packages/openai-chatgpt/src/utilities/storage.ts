import { useStorage } from '@peke/lib/hooks/useStorage';

const storageUtil = useStorage();

export function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const storedItem = storageUtil.getItem(key);
    return storedItem ? (JSON.parse(storedItem) as T) : defaultValue;
  } catch (error) {
    console.error(`Error parsing item from localStorage for key "${key}":`, error);
    return defaultValue;
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  try {
    storageUtil.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item to localStorage for key "${key}":`, error);
  }
}
