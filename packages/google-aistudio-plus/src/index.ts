import { setAutorun } from '@/helpers/autorun';

function createCtrlRearranger(): () => void {
  const SLIDE_TOGGLE = 'mat-slide-toggle';
  const ACTIVE_TOGGLE = 'button.mdc-switch--selected';
  const RUN_BUTTON = 'button[aria-label="Run the app"]';
  const BUTTONS_WRAPPER = 'div.buttons-wrapper';

  let isLayoutLocked = false;

  return function rearrange(): void {
    if (isLayoutLocked) {
      return;
    }

    const slideToggle = document.querySelector(SLIDE_TOGGLE);
    const runButton = document.querySelector(RUN_BUTTON);
    const btnsWrapper = document.querySelector(BUTTONS_WRAPPER);

    if (slideToggle && runButton && btnsWrapper) {
      const activeToggle = slideToggle.querySelector<HTMLElement>(ACTIVE_TOGGLE);
      if (activeToggle) {
        activeToggle.click();
      }

      btnsWrapper.insertBefore(slideToggle, btnsWrapper.firstChild);
      btnsWrapper.insertBefore(runButton, slideToggle.nextSibling);
      isLayoutLocked = true;
    }
  };
}

function createTabManager(): () => void {
  const TAB_LINK = 'a.mat-mdc-tab-link';
  const RUNNING_ICON = 'svg.running-icon.ng-star-inserted';
  const CLOSE_BUTTON = 'button[aria-label="Close file"]';

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
  const rearrangeCtrls = createCtrlRearranger();
  const manageTabs = createTabManager();

  const observer = new MutationObserver(() => {
    rearrangeCtrls();
    manageTabs();
  });

  const observerConfig: MutationObserverInit = {
    subtree: true,
    childList: true,
  };

  observer.observe(document.body, observerConfig);
}

setAutorun('complete', main);
