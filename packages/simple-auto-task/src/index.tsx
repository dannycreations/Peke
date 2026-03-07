import { runOnInteractive, runOnObserver } from '@/helpers/autorun';
import { protectKeys } from '@/hooks/useStorage';
import { render } from 'preact';

import { App } from './app/App';
import { STORAGE_AUTORUN_KEY, STORAGE_CONFIG_KEY } from './app/constants';
import { APP_STYLES, GLOBAL_STYLES } from './app/styles';

const ROOT_ELEMENT_ID = 'sat-root';

function injectGlobalStyles(): void {
  const styleId = 'sat-global-styles';
  if (document.getElementById(styleId)) {
    return;
  }

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = GLOBAL_STYLES;
  document.head.appendChild(styleEl);
}

function initializePanel(): void {
  if (!document.body) {
    console.warn('document.body not found. Cannot initialize panel.');
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

  let appContainer = shadowRoot.querySelector('#app-container');
  if (!appContainer) {
    shadowRoot.innerHTML = '';

    const styleEl = document.createElement('style');
    styleEl.textContent = APP_STYLES;
    shadowRoot.appendChild(styleEl);

    appContainer = document.createElement('div');
    appContainer.id = 'app-container';
    shadowRoot.appendChild(appContainer);
  }

  render(<App />, appContainer);
}

function main(): void {
  protectKeys([STORAGE_CONFIG_KEY, STORAGE_AUTORUN_KEY]);
  injectGlobalStyles();
  initializePanel();

  runOnObserver(
    () => {
      if (!document.getElementById(ROOT_ELEMENT_ID)) {
        console.warn('Root element has been removed from DOM. Re-injecting...');
        initializePanel();
      }
    },
    {
      target: document.body,
      options: { childList: true, subtree: false },
    },
  );
}

runOnInteractive(main);
