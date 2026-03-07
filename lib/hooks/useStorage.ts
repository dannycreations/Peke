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
let originalGetItem: typeof Storage.prototype.getItem;
let originalRemoveItem: typeof Storage.prototype.removeItem;
let originalClear: typeof Storage.prototype.clear;

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
  originalGetItem = Storage.prototype.getItem;
  originalRemoveItem = Storage.prototype.removeItem;
  originalClear = Storage.prototype.clear;

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
    const savedItems: Record<string, string> = {};
    for (const key of protectedKeys) {
      const value = originalGetItem!.call(this, key);
      if (value !== null) {
        savedItems[key] = value;
      }
    }

    originalClear!.call(this);

    for (const key in savedItems) {
      originalSetItem!.call(this, key, savedItems[key]);
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
    getItem: (key) => getItem(storage, key),
    setItem: (key, value) => setItem(storage, key, value),
    removeItem: (key) => removeItem(storage, key),
    clear: () => clear(storage),
  };
}

/**
 * Sets an item's value in the specified storage instance.
 * It uses the original `setItem` method if it has been monkey-patched.
 *
 * @param {Storage} storage The storage object (e.g., `localStorage`).
 * @param {string} key The key of the item to set.
 * @param {string} value The value to set for the item.
 * @returns {void}
 */
function setItem(storage: Storage, key: string, value: string): void {
  if (!originalSetItem) {
    storage.setItem(key, value);
    return;
  }

  originalSetItem.call(storage, key, value);
}

/**
 * Gets an item's value from the specified storage instance.
 * It uses the original `getItem` method if it has been monkey-patched.
 *
 * @param {Storage} storage The storage object (e.g., `localStorage`).
 * @param {string} key The key of the item to retrieve.
 * @returns {string | null} The value of the item, or `null` if the key is not found.
 */
function getItem(storage: Storage, key: string): string | null {
  if (!originalGetItem) {
    return storage.getItem(key);
  }

  return originalGetItem.call(storage, key);
}

/**
 * Removes an item from the specified storage instance.
 * It uses the original `removeItem` method if it has been monkey-patched.
 *
 * @param {Storage} storage The storage object (e.g., `localStorage`).
 * @param {string} key The key of the item to remove.
 * @returns {void}
 */
function removeItem(storage: Storage, key: string): void {
  if (!originalRemoveItem) {
    storage.removeItem(key);
    return;
  }

  originalRemoveItem.call(storage, key);
}

/**
 * Clears all items from the specified storage instance.
 * It uses the original `clear` method if it has been monkey-patched, which
 * respects any keys protected by {@link protectKeys}.
 *
 * @param {Storage} storage The storage object (e.g., `localStorage`).
 * @returns {void}
 */
function clear(storage: Storage): void {
  if (!originalClear) {
    storage.clear();
    return;
  }

  originalClear.call(storage);
}
