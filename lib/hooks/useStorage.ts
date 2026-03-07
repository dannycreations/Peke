/**
 * Defines a standardized interface for interacting with web storage mechanisms
 * like `localStorage` or `sessionStorage`.
 */
export interface UseStorage {
  /** Retrieves an item from storage for a given key. */
  readonly getItem: (key: string) => string | null;

  /** Sets an item in storage for a given key. */
  readonly setItem: (key: string, value: string) => void;

  /** Removes an item from storage for a given key. */
  readonly removeItem: (key: string) => void;

  /** Clears all items from storage, respecting protected keys if set. */
  readonly clear: () => void;
}

const protectedKeys = new Set<string>();

let isProtected = false;
let originalSetItem: typeof Storage.prototype.setItem;
let originalRemoveItem: typeof Storage.prototype.removeItem;

/**
 * Protects specified keys in all `Storage` instances (localStorage, sessionStorage)
 * from being modified or removed. This function monkey-patches the global
 * `Storage.prototype` methods and should only be called once.
 *
 * @example
 * ```typescript
 * // Protect 'user-session' and 'auth-token' from being cleared or changed.
 * protectKeys(['user-session', 'auth-token']);
 *
 * localStorage.setItem('user-session', 'active'); // Will be ignored
 * localStorage.removeItem('user-session'); // Will be ignored
 * localStorage.clear(); // Clears all keys except 'user-session' and 'auth-token'
 * ```
 *
 * @param {string[]} keys An array of storage keys to protect.
 * @returns {void}
 */
export function protectKeys(keys: string[]): void {
  if (isProtected || !keys?.length) {
    return;
  }
  isProtected = true;

  originalSetItem = Storage.prototype.setItem;
  originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (this: Storage, key: string, value: string): void {
    if (protectedKeys.has(key)) {
      return;
    }

    originalSetItem!.call(this, key, value);
  };

  Storage.prototype.removeItem = function (this: Storage, key: string): void {
    if (protectedKeys.has(key)) {
      return;
    }

    originalRemoveItem!.call(this, key);
  };

  Storage.prototype.clear = function (this: Storage): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.length; i++) {
      const key = this.key(i);
      if (key !== null && !protectedKeys.has(key)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      originalRemoveItem!.call(this, key);
    }
  };

  for (const key of keys) {
    protectedKeys.add(key);
  }
}

/**
 * Creates a storage utility object that provides a safe interface to the
 * specified storage mechanism, respecting any protections set by `protectKeys`.
 *
 * @example
 * ```typescript
 * // Using the default localStorage
 * const storage = useStorage();
 * storage.setItem('theme', 'dark');
 * const theme = storage.getItem('theme'); // 'dark'
 *
 * // Using sessionStorage
 * const session = useStorage(sessionStorage);
 * session.setItem('temp-data', '123');
 * ```
 *
 * @param {Storage=} [storage=localStorage] The web storage object to use, such as `localStorage` or `sessionStorage`.
 * @returns {UseStorage} An object with methods to interact with the specified storage.
 */
export function useStorage(storage: Storage = localStorage): UseStorage {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    clear: () => storage.clear(),
  } as const;
}
