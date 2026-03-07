import { useCallback, useEffect, useRef } from 'preact/hooks';

import { isPicking, isRunning, lastHoveredElement, useStore } from '../stores/useStore';
import { generateSelector } from '../utilities/dom';

import type { RefObject } from 'preact';

interface UseElementPickerProps {
  readonly panelContainerRef: RefObject<HTMLDivElement>;
  readonly rulesPanelRef: RefObject<HTMLDivElement>;
}

interface UseElementPickerReturn {
  readonly startPicking: (onElementPicked: (selector: string) => void) => void;
}

export const useElementPicker = ({ panelContainerRef, rulesPanelRef }: UseElementPickerProps): UseElementPickerReturn => {
  const onElementPickedRef = useRef<(selector: string) => void>(() => {});

  const startPicking = useCallback((onElementPicked: (selector: string) => void) => {
    if (isRunning.value || isPicking.value) return;
    onElementPickedRef.current = onElementPicked;
    useStore.setIsPicking(true);
  }, []);

  useEffect(() => {
    if (!isPicking.value) {
      return;
    }

    let isPaused: boolean = false;
    let lastClientX = 0;
    let lastClientY = 0;

    const highlightElement = (target: Element | null): void => {
      if (!target) {
        return;
      }

      if (panelContainerRef.current?.contains(target) || rulesPanelRef.current?.contains(target)) {
        if (lastHoveredElement.value) {
          lastHoveredElement.value.classList.remove('highlight-pick');
          useStore.setLastHoveredElement(null);
        }
        return;
      }

      if (target === lastHoveredElement.value) {
        return;
      }

      if (lastHoveredElement.value) {
        lastHoveredElement.value.classList.remove('highlight-pick');
      }

      if (target?.classList) {
        target.classList.add('highlight-pick');
        useStore.setLastHoveredElement(target);
      }
    };

    let hoverRafId: number | null = null;
    const handlePickingHover = (event: MouseEvent): void => {
      lastClientX = event.clientX;
      lastClientY = event.clientY;

      if (isPaused) return;

      if (hoverRafId !== null) cancelAnimationFrame(hoverRafId);
      hoverRafId = requestAnimationFrame(() => {
        const target = document.elementFromPoint(lastClientX, lastClientY);
        if (target) highlightElement(target);
        hoverRafId = null;
      });
    };

    const handlePickingClick = (event: MouseEvent): void => {
      const target = event.composedPath()[0] as Element;

      if (isPaused || panelContainerRef.current?.contains(target) || rulesPanelRef.current?.contains(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const selector: string = generateSelector(target);
      onElementPickedRef.current(selector);
      useStore.setIsPicking(false);
    };

    const handleKeyEvent = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        useStore.setIsPicking(false);
        return;
      }

      if (event.key === 'Control') {
        if (event.type === 'keydown' && !isPaused) {
          isPaused = true;
          document.body.style.cursor = 'default';
          if (lastHoveredElement.value) {
            lastHoveredElement.value.classList.remove('highlight-pick');
            useStore.setLastHoveredElement(null);
          }
        } else if (event.type === 'keyup' && isPaused) {
          isPaused = false;
          document.body.style.cursor = 'crosshair';
          const target = document.elementFromPoint(lastClientX, lastClientY);
          highlightElement(target);
        }
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
      if (lastHoveredElement.value) {
        lastHoveredElement.value.classList.remove('highlight-pick');
        useStore.setLastHoveredElement(null);
      }

      document.removeEventListener('mouseover', handlePickingHover, { capture: true });
      document.removeEventListener('click', handlePickingClick, { capture: true });
      document.removeEventListener('keydown', handleKeyEvent, { capture: true });
      document.removeEventListener('keyup', handleKeyEvent, { capture: true });
      if (hoverRafId !== null) cancelAnimationFrame(hoverRafId);
    };
  }, [isPicking.value, panelContainerRef, rulesPanelRef]);

  return { startPicking };
};
