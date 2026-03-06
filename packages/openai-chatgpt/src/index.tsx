import { runOnObserver } from '@/helpers/autorun';
import { render } from 'preact';

import { AppView } from './app/App';
import { CONFIG } from './app/constants';
import { modelIdSignal, systemPromptSignal } from './stores/useStore';

function patch(): void {
  if (window.originalFetch) return;

  const originalFetch = window.fetch.bind(window);
  window.originalFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    try {
      const url = (typeof input === 'string' ? input : (input as any)?.url || (input as any)?.toString()) || '';
      const method = (init.method || (input as any)?.method || 'GET').toUpperCase();

      if (method === 'POST' && url.endsWith('conversation')) {
        let body: any;
        try {
          body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
        } catch (e) {
          return originalFetch(input, init);
        }

        if (body && typeof body === 'object') {
          if (typeof body.model === 'string') {
            body.model = modelIdSignal.value;
          }

          if (Array.isArray(body.messages)) {
            body.messages.unshift({
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
      }
    } catch (error) {
      console.error('Error modifying fetch options:', error);
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
runOnObserver(main, { target: document.documentElement });

declare global {
  interface Window {
    originalFetch?(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  }
}
