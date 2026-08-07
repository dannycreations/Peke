import { CONFIG } from '../app/constants';
import { getStoredItem, setStoredItem } from '../utilities/storage';
import { getCurrentPath, normalizePath } from './locationHelper';

export interface PromptEntry {
  readonly prompt: string;
  readonly updatedAt: number;
}

export type PromptStore = Record<string, PromptEntry>;

const ROOT_PATH = '/';
const CONVERSATION_RE = /\/c\/([^/?#]+)/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getConversationId(path: string): string {
  const match = CONVERSATION_RE.exec(path);
  return match ? match[1] : '';
}

export function isConversationPath(path: string): boolean {
  return getConversationId(path) !== '';
}

// A new chat first lives on a client generated url, e.g. `/c/WEB:<uuid>`, and is
// swapped for `/c/<uuid>` once the backend assigns the real conversation id.
export function isDraftPath(path: string): boolean {
  const id = getConversationId(path);
  return id !== '' && !UUID_RE.test(id);
}

export function readPromptStore(): PromptStore {
  return normalizeStore(getStoredItem<unknown>(CONFIG.PROMPT_STORAGE_KEY, {}));
}

export function writePromptStore(store: PromptStore): void {
  setStoredItem(CONFIG.PROMPT_STORAGE_KEY, store);
}

export function resolvePrompt(store: PromptStore, path: string): string {
  const entry = store[path] || store[ROOT_PATH];
  return entry ? entry.prompt : '';
}

export function resolveCurrentPrompt(): string {
  return resolvePrompt(readPromptStore(), getCurrentPath());
}

let lastPath = getCurrentPath();

// Keeps the store in sync with the current url, carrying a prompt over whenever
// ChatGPT replaces the url of the chat it belongs to.
export function syncPrompt(): string {
  const store = readPromptStore();
  const path = getCurrentPath();
  const previousPath = lastPath;
  lastPath = path;

  migratePrompt(store, previousPath, path);
  prunePrompts(store, path);
  writePromptStore(store);

  return resolvePrompt(store, path);
}

export function savePrompt(value: string): boolean {
  const prompt = value.trim();
  const path = getCurrentPath();
  const store = readPromptStore();
  const current = store[path] ? store[path].prompt : '';

  if (current === prompt) return false;

  if (prompt) {
    store[path] = { prompt, updatedAt: Date.now() };
  } else {
    delete store[path];
  }

  writePromptStore(store);
  return true;
}

function migratePrompt(store: PromptStore, from: string, to: string): void {
  if (!isConversationPath(to) || store[to]) return;

  const source = findPromptSource(store, from, to);
  if (!source) return;

  store[to] = { prompt: store[source].prompt, updatedAt: Date.now() };
  delete store[source];
}

function findPromptSource(store: PromptStore, from: string, to: string): string {
  if (from !== to && store[from]) {
    // Draft url replaced by the permanent conversation url.
    if (isDraftPath(from)) return from;
    // Composer page, e.g. the home page, that just spawned a new chat.
    if (!isConversationPath(from) && isDraftPath(to)) return from;
  }

  // A url swap was missed, so fall back to the most recent orphaned draft.
  return findOrphanDraft(store, to);
}

function findOrphanDraft(store: PromptStore, to: string): string {
  const now = Date.now();
  let latest = '';

  for (const key of Object.keys(store)) {
    if (key === to || !isDraftPath(key)) continue;
    if (now - store[key].updatedAt > CONFIG.PROMPT_DRAFT_TTL) continue;
    if (!latest || store[key].updatedAt > store[latest].updatedAt) latest = key;
  }

  return latest;
}

// Pruning is time based on purpose. The sidebar is populated asynchronously, so
// deriving live conversations from the dom wipes the store on a fresh tab.
function prunePrompts(store: PromptStore, path: string): void {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (key === path) continue;
    if (isDraftPath(key) && now - store[key].updatedAt > CONFIG.PROMPT_DRAFT_TTL) {
      delete store[key];
    }
  }

  const prunable = Object.keys(store).filter((key) => key !== path && key !== ROOT_PATH);
  if (prunable.length <= CONFIG.PROMPT_MAX_ENTRIES) return;

  prunable.sort((a, b) => store[b].updatedAt - store[a].updatedAt);
  for (const key of prunable.slice(CONFIG.PROMPT_MAX_ENTRIES)) {
    delete store[key];
  }
}

function normalizeStore(raw: unknown): PromptStore {
  const store: PromptStore = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return store;

  const now = Date.now();
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key.startsWith('/')) continue;

    const entry = normalizeEntry(value, now);
    if (entry) {
      store[normalizePath(key)] = entry;
    }
  }

  return store;
}

function normalizeEntry(value: unknown, now: number): PromptEntry | null {
  // Legacy format stored the prompt as a plain string.
  if (typeof value === 'string') {
    const prompt = value.trim();
    return prompt ? { prompt, updatedAt: now } : null;
  }

  if (value && typeof value === 'object') {
    const { prompt, updatedAt } = value as Partial<PromptEntry>;
    if (typeof prompt !== 'string' || !prompt.trim()) return null;

    const timestamp = typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : now;
    return { prompt: prompt.trim(), updatedAt: timestamp };
  }

  return null;
}
