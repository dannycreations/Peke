import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFIG } from '../app/constants';

type PromptHelper = typeof import('./promptHelper');

const DRAFT_PATH = '/c/WEB:af3db0c2-17d8-41df-904b-4eb27a1c44aa';
const CHAT_PATH = '/c/6a75ee9e-628c-83ec-87e7-0837942484ab';
const OTHER_CHAT_PATH = '/c/1b0f2c33-4d55-4e66-8f77-99aabbccddee';

const store = new Map<string, string>();

function setPath(pathname: string): void {
  (globalThis.window as unknown as { location: { pathname: string } }).location.pathname = pathname;
}

// A fresh import mimics a page load, e.g. opening the site in a new tab.
async function openPage(pathname: string): Promise<PromptHelper> {
  setPath(pathname);
  vi.resetModules();
  return await import('./promptHelper');
}

function readRaw(): Record<string, { prompt: string; updatedAt: number }> {
  return JSON.parse(store.get(CONFIG.PROMPT_STORAGE_KEY) || '{}');
}

function writeRaw(value: unknown): void {
  store.set(CONFIG.PROMPT_STORAGE_KEY, JSON.stringify(value));
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    },
  });

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: {
      location: { pathname: '/' },
      history: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    },
  });
});

beforeEach(() => {
  store.clear();
});

describe('promptHelper', () => {
  it('should classify draft and permanent conversation urls', async () => {
    const helper = await openPage('/');

    expect(helper.isConversationPath('/')).toBe(false);
    expect(helper.isConversationPath(DRAFT_PATH)).toBe(true);
    expect(helper.isConversationPath(CHAT_PATH)).toBe(true);
    expect(helper.isDraftPath(DRAFT_PATH)).toBe(true);
    expect(helper.isDraftPath(CHAT_PATH)).toBe(false);
    expect(helper.isDraftPath('/')).toBe(false);
  });

  it('should carry the prompt from home through the draft url to the permanent url', async () => {
    const helper = await openPage('/');
    expect(helper.savePrompt('be concise')).toBe(true);

    setPath(DRAFT_PATH);
    expect(helper.syncPrompt()).toBe('be concise');
    expect(Object.keys(readRaw())).toEqual([DRAFT_PATH]);

    setPath(CHAT_PATH);
    expect(helper.syncPrompt()).toBe('be concise');
    expect(Object.keys(readRaw())).toEqual([CHAT_PATH]);
  });

  it('should adopt an orphaned draft prompt when the draft url change was missed', async () => {
    const helper = await openPage('/');
    writeRaw({ [DRAFT_PATH]: { prompt: 'be concise', updatedAt: Date.now() } });

    setPath(CHAT_PATH);
    expect(helper.syncPrompt()).toBe('be concise');
    expect(Object.keys(readRaw())).toEqual([CHAT_PATH]);
  });

  it('should not steal a prompt from another conversation', async () => {
    const helper = await openPage(CHAT_PATH);
    expect(helper.savePrompt('chat prompt')).toBe(true);

    setPath(OTHER_CHAT_PATH);
    expect(helper.syncPrompt()).toBe('');
    expect(readRaw()[CHAT_PATH].prompt).toBe('chat prompt');
  });

  it('should keep stored prompts when a new tab loads before the sidebar', async () => {
    const helper = await openPage(CHAT_PATH);
    helper.savePrompt('chat prompt');

    const newTab = await openPage('/');
    expect(newTab.syncPrompt()).toBe('');
    expect(readRaw()[CHAT_PATH].prompt).toBe('chat prompt');

    const revisit = await openPage(CHAT_PATH);
    expect(revisit.syncPrompt()).toBe('chat prompt');
  });

  it('should upgrade the legacy string format', async () => {
    writeRaw({ [CHAT_PATH]: 'legacy prompt', '/': 'home prompt' });

    const helper = await openPage(CHAT_PATH);
    expect(helper.syncPrompt()).toBe('legacy prompt');
    expect(readRaw()[CHAT_PATH].updatedAt).toBeTypeOf('number');
    expect(readRaw()['/'].prompt).toBe('home prompt');
  });

  it('should keep the home prompt as a fallback when opening an existing chat', async () => {
    const helper = await openPage('/');
    helper.savePrompt('home prompt');

    setPath(OTHER_CHAT_PATH);
    expect(helper.syncPrompt()).toBe('home prompt');
    expect(readRaw()['/'].prompt).toBe('home prompt');
    expect(readRaw()[OTHER_CHAT_PATH]).toBeUndefined();
  });

  it('should drop stale drafts and cap the number of stored prompts', async () => {
    const stale = Date.now() - CONFIG.PROMPT_DRAFT_TTL - 1;
    const entries: Record<string, { prompt: string; updatedAt: number }> = {
      [DRAFT_PATH]: { prompt: 'stale draft', updatedAt: stale },
    };
    for (let i = 0; i <= CONFIG.PROMPT_MAX_ENTRIES; i++) {
      entries[`/c/${i.toString().padStart(8, '0')}-628c-83ec-87e7-0837942484ab`] = { prompt: `prompt ${i}`, updatedAt: i };
    }
    writeRaw(entries);

    const helper = await openPage('/');
    helper.syncPrompt();

    const saved = readRaw();
    expect(saved[DRAFT_PATH]).toBeUndefined();
    expect(Object.keys(saved).length).toBe(CONFIG.PROMPT_MAX_ENTRIES);
    expect(saved['/c/00000000-628c-83ec-87e7-0837942484ab']).toBeUndefined();
  });
});
