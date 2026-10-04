import { useCallback, useEffect, useRef } from 'preact/hooks';

import { ROOT_ELEMENT_ID } from '../app/constants';
import { isPicking, isRunning, lastHoveredElement } from '../stores/useStore';
import { generateSelector } from '../utilities/dom';

import type { RefObject } from 'preact';

interface UseElementPickerProps {
  readonly panelContainerRef: RefObject<HTMLDivElement | null>;
  readonly rulesPanelRef: RefObject<HTMLDivElement | null>;
}

interface UseElementPickerReturn {
  readonly startPicking: (onElementPicked: (selector: string) => void) => void;
}

export const useElementPicker = ({ panelContainerRef, rulesPanelRef }: UseElementPickerProps): UseElementPickerReturn => {
  const onElementPickedRef = useRef<(selector: string) => void>(() => {});

  const startPicking = useCallback((onElementPicked: (selector: string) => void) => {
    if (isRunning.value || isPicking.value) return;
    onElementPickedRef.current = onElementPicked;
    isPicking.value = true;
  }, []);

  useEffect(() => {
    if (!isPicking.value) {
      return;
    }

    let isPaused = false;
    let lastClientX = 0;
    let lastClientY = 0;
    let hoverRafId: number | null = null;

    const isOwnElement = (target: Element): boolean => {
      const shadowHost = document.getElementById(ROOT_ELEMENT_ID);
      const isInsideShadowRoot =
        shadowHost !== null && (shadowHost === target || shadowHost.contains(target) || target.getRootNode() === shadowHost.shadowRoot);
      return isInsideShadowRoot || panelContainerRef.current?.contains(target) === true || rulesPanelRef.current?.contains(target) === true;
    };

    const clearHighlight = (): void => {
      lastHoveredElement.value?.classList.remove('highlight-pick');
      lastHoveredElement.value = null;
    };

    const highlightElement = (target: Element): void => {
      if (isOwnElement(target)) {
        clearHighlight();
        return;
      }

      if (target === lastHoveredElement.value) {
        return;
      }

      clearHighlight();
      target.classList.add('highlight-pick');
      lastHoveredElement.value = target;
    };

    const handlePickingHover = (event: MouseEvent): void => {
      lastClientX = event.clientX;
      lastClientY = event.clientY;

      if (isPaused || hoverRafId !== null) return;

      hoverRafId = requestAnimationFrame(() => {
        hoverRafId = null;
        const target = document.elementFromPoint(lastClientX, lastClientY);
        if (target) highlightElement(target);
      });
    };

    const handlePickingClick = (event: MouseEvent): void => {
      const target = event.composedPath()[0] as Element;
      if (isPaused || isOwnElement(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      onElementPickedRef.current(generateSelector(target));
      isPicking.value = false;
    };

    const handleKeyEvent = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        isPicking.value = false;
        return;
      }

      if (event.key !== 'Control') {
        return;
      }

      if (event.type === 'keydown' && !isPaused) {
        isPaused = true;
        document.body.style.cursor = 'default';
        clearHighlight();
      } else if (event.type === 'keyup' && isPaused) {
        isPaused = false;
        document.body.style.cursor = 'crosshair';
        const target = document.elementFromPoint(lastClientX, lastClientY);
        if (target) highlightElement(target);
      }
    };

    panelContainerRef.current?.classList.add('picking-mode-panel');
    rulesPanelRef.current?.classList.add('picking-mode-panel');
    document.body.style.cursor = 'crosshair';

    document.addEventListener('mouseover', handlePickingHover, { capture: true });
    document.addEventListener('click', handlePickingClick, { capture: true });
    document.addEventListener('keydown', handleKeyEvent, { capture: true });
    document.addEventListener('keyup', handleKeyEvent, { capture: true });

    return () => {
      panelContainerRef.current?.classList.remove('picking-mode-panel');
      rulesPanelRef.current?.classList.remove('picking-mode-panel');
      document.body.style.cursor = 'default';
      clearHighlight();

      document.removeEventListener('mouseover', handlePickingHover, { capture: true });
      document.removeEventListener('click', handlePickingClick, { capture: true });
      document.removeEventListener('keydown', handleKeyEvent, { capture: true });
      document.removeEventListener('keyup', handleKeyEvent, { capture: true });
      if (hoverRafId !== null) cancelAnimationFrame(hoverRafId);
    };
  }, [isPicking.value, panelContainerRef, rulesPanelRef]);

  return { startPicking };
};
