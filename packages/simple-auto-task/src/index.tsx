import { StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { App } from './app/App';
import { STORAGE_CONFIG_KEY, STORAGE_RUNNER_KEY } from './app/constants';
import { SAT_APP_STYLES, SAT_GLOBAL_STYLES } from './app/styles';

const ROOT_ELEMENT_ID = 'sat-root';
let reactRoot: Root | null = null;

function injectGlobalStyles(): void {
  const styleId = 'sat-global-styles';
  if (document.getElementById(styleId)) {
    return;
  }

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = SAT_GLOBAL_STYLES;
  document.head.appendChild(styleEl);
}

function initializePanel(): void {
  if (!document.body) {
    console.warn('SAT Panel: document.body not found. Cannot initialize panel.');
    return;
  }

  let shadowHost = document.getElementById(ROOT_ELEMENT_ID);

  if (!shadowHost) {
    shadowHost = document.createElement('div');
    shadowHost.id = ROOT_ELEMENT_ID;
    document.body.appendChild(shadowHost);
  }

  let shadowRoot = shadowHost.shadowRoot;
  if (!shadowRoot) {
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  }

  let appContainer = shadowRoot.querySelector('#sat-app-container');
  if (!appContainer) {
    shadowRoot.innerHTML = '';

    const styleEl = document.createElement('style');
    styleEl.textContent = SAT_APP_STYLES;
    shadowRoot.appendChild(styleEl);

    appContainer = document.createElement('div');
    appContainer.id = 'sat-app-container';
    shadowRoot.appendChild(appContainer);

    if (reactRoot) {
      reactRoot.unmount();
    }
    reactRoot = createRoot(appContainer);
  } else if (!reactRoot) {
    reactRoot = createRoot(appContainer);
  }

  reactRoot.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

function main(): void {
  injectGlobalStyles();

  try {
    const originalClear = Storage.prototype.clear;
    Storage.prototype.clear = function (this: Storage): void {
      const config = this.getItem(STORAGE_CONFIG_KEY);
      const runner = this.getItem(STORAGE_RUNNER_KEY);
      originalClear.call(this);
      if (config) {
        this.setItem(STORAGE_CONFIG_KEY, config);
      }
      if (runner) {
        this.setItem(STORAGE_RUNNER_KEY, runner);
      }
    };

    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (this: Storage, key: string): void {
      if (key === STORAGE_CONFIG_KEY || key === STORAGE_RUNNER_KEY) {
        console.warn(`SAT Panel: Attempt to remove protected key "${key}" was blocked.`);
        return;
      }
      originalRemoveItem.call(this, key);
    };
  } catch (error) {
    console.error('SAT Panel: Failed to protect localStorage.', error);
  }

  initializePanel();

  setInterval(() => {
    const currentRootElement = document.getElementById(ROOT_ELEMENT_ID);

    if (!document.body || !currentRootElement || !document.body.contains(currentRootElement)) {
      console.warn('SAT Panel: Root element has been removed from DOM. Re-injecting...');

      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
      }

      if (currentRootElement) {
        currentRootElement.remove();
      }

      initializePanel();
    }
  }, 1000);
}

main();
