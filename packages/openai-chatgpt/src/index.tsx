import { render } from 'preact';

import { runOnObserver } from '@peke/lib/helpers/autorun';
import { AppView } from './app/App';
import { CONFIG } from './app/constants';
import { notifyLocationChange, watchLocation } from './helpers/locationHelper';
import { modelIdSignal, systemPromptSignal } from './stores/useStore';

function patch(): void {
  if (window.originalFetch) return;

  const originalFetch = window.fetch.bind(window);
  window.originalFetch = originalFetch;

  window.fetch = async (input, init = {}) => {
    const isRequest = typeof input === 'object' && input !== null && 'url' in input;
    const url = typeof input === 'string' ? input : isRequest ? input.url : input.href;
    const method = (init.method ?? (isRequest ? input.method : 'GET')).toUpperCase();

    if (method === 'POST' && url.endsWith('conversation')) {
      try {
        const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;

        if (body && typeof body === 'object' && !Array.isArray(body)) {
          body.model = modelIdSignal.value;

          const messages = body.messages;
          if (Array.isArray(messages)) {
            messages.unshift({
              id: crypto.randomUUID(),
              author: { role: 'system' },
              create_time: Date.now() / 1000,
              content: {
                content_type: 'text',
                parts: [systemPromptSignal.value || CONFIG.DEFAULT_SYSTEM_PROMPT],
              },
              metadata: {
                is_visually_hidden_from_conversation: true,
              },
            });
          }

          init.body = JSON.stringify(body);
        }
      } catch {}
    }
    return originalFetch(input, init);
  };
}

function main(): void {
  if (document.getElementById(CONFIG.ROOT_ELEMENT_ID)) return;

  const container = document.querySelector(CONFIG.UI_CONTAINER_SEL);
  if (!container) return;

  const rootElement = document.createElement('div');
  rootElement.id = CONFIG.ROOT_ELEMENT_ID;
  container.prepend(rootElement);

  render(<AppView />, rootElement);
}

patch();
watchLocation();
runOnObserver(
  () => {
    // Safety net for url swaps that never reach the history api.
    notifyLocationChange();
    main();
  },
  { target: document.documentElement },
);

declare global {
  interface Window {
    originalFetch?(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  }
}
