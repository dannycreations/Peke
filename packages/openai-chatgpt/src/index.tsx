import { runOnObserver } from '@/helpers/autorun';
import { render } from 'preact';

import { AppView } from './app/App';
import { CONFIG } from './app/constants';
import { notifyLocationChange, watchLocation } from './helpers/locationHelper';
import { modelIdSignal, systemPromptSignal } from './stores/useStore';

function patch(): void {
  if (window.originalFetch) return;

  const originalFetch = window.fetch.bind(window);
  window.originalFetch = originalFetch;

  window.fetch = async (input, init = {}) => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as Request).url;
    }

    let rawMethod = 'GET';
    if (init && typeof init.method === 'string') {
      rawMethod = init.method;
    } else if (input && typeof input === 'object' && 'method' in input && typeof (input as Request).method === 'string') {
      rawMethod = (input as Request).method;
    }

    const method = rawMethod.toUpperCase();
    if (method === 'POST' && url && url.endsWith('conversation')) {
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
  const container = document.querySelector(CONFIG.UI_CONTAINER_SEL);
  if (!container) return;
  if (container.querySelector('#ms-react-root')) return;

  const rootElement = document.createElement('div');
  rootElement.id = 'ms-react-root';
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
