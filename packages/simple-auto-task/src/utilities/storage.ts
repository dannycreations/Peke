import { useStorage } from '@peke/lib/hooks/useStorage';

import type { UseStorage } from '@peke/lib/hooks/useStorage';

let storage: UseStorage | null = null;

export function getStorage(): UseStorage {
  storage ??= useStorage();
  return storage;
}
