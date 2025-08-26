import { setAutorun } from '@/helpers/autorun';
import { debounce } from 'es-toolkit';

function createTabManager(): () => void {
  const TAB_LINK = 'div.tab';
  const RUNNING_ICON = 'svg.running-icon.ng-star-inserted';
  const CLOSE_BUTTON = 'button[mattooltip="Close file"]';

  let initialTab: Element | null = null;

  return function manageTabs(): void {
    if (!document.querySelector(RUNNING_ICON)) {
      return;
    }

    const tabs = document.querySelectorAll<Element>(TAB_LINK);
    const tabCount = tabs.length;

    if (tabCount === 1) {
      initialTab = tabs[0];
      return;
    }

    if (tabCount >= 3) {
      const middleIndex = Math.floor((tabCount - 1) / 2);
      const middleTab = tabs[middleIndex];

      if (middleTab && middleTab !== initialTab) {
        const closeButton = middleTab.querySelector<HTMLElement>(CLOSE_BUTTON);
        if (closeButton) {
          closeButton.click();
        }
      }
    }
  };
}

function main(): void {
  const manageTabs = createTabManager();

  const debouncedManageTabs = debounce(manageTabs, 100);

  const observer = new MutationObserver(() => {
    debouncedManageTabs();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

setAutorun('complete', main);
