import { useCallback, useEffect, useRef } from 'react';

import { useAppStore } from '../stores/appStore';
import { generateSelector } from '../utils/utils';

import type { RefObject } from 'react';

interface UseElementPickerProps {
  readonly panelContainerRef: RefObject<HTMLDivElement | null>;
  readonly rulesPanelRef: RefObject<HTMLDivElement | null>;
}

interface UseElementPickerReturn {
  readonly startPicking: (onElementPicked: (selector: string) => void) => void;
}

export const useElementPicker = ({ panelContainerRef, rulesPanelRef }: UseElementPickerProps): UseElementPickerReturn => {
  const isPicking = useAppStore((state) => state.isPicking);
  const setIsPicking = useAppStore((state) => state.setIsPicking);
  const setLastHoveredElement = useAppStore((state) => state.setLastHoveredElement);
  const onElementPickedRef = useRef<(selector: string) => void>(() => {});

  const startPicking = useCallback(
    (onElementPicked: (selector: string) => void) => {
      const { isPicking: currentIsPicking, isRunning } = useAppStore.getState();
      if (isRunning || currentIsPicking) return;
      onElementPickedRef.current = onElementPicked;
      setIsPicking(true);
    },
    [setIsPicking],
  );

  useEffect(() => {
    if (!isPicking) {
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
        const { lastHoveredElement } = useAppStore.getState();
        if (lastHoveredElement) {
          lastHoveredElement.classList.remove('sat-highlight-pick');
          setLastHoveredElement(null);
        }
        return;
      }

      const { lastHoveredElement } = useAppStore.getState();

      if (target === lastHoveredElement) {
        return;
      }

      if (lastHoveredElement) {
        lastHoveredElement.classList.remove('sat-highlight-pick');
      }
      if (target?.classList) {
        target.classList.add('sat-highlight-pick');
        setLastHoveredElement(target);
      }
    };

    const handlePickingHover = (event: MouseEvent): void => {
      lastClientX = event.clientX;
      lastClientY = event.clientY;

      if (isPaused) {
        return;
      }
      const target = event.composedPath()[0] as Element;
      highlightElement(target);
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
      setIsPicking(false);
    };

    const handleKeyEvent = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setIsPicking(false);
        return;
      }

      if (event.key === 'Control') {
        if (event.type === 'keydown' && !isPaused) {
          isPaused = true;
          document.body.style.cursor = 'default';
          const { lastHoveredElement } = useAppStore.getState();
          if (lastHoveredElement) {
            lastHoveredElement.classList.remove('sat-highlight-pick');
            setLastHoveredElement(null);
          }
        } else if (event.type === 'keyup' && isPaused) {
          isPaused = false;
          document.body.style.cursor = 'crosshair';
          const target = document.elementFromPoint(lastClientX, lastClientY);
          highlightElement(target);
        }
      }
    };

    panelContainerRef.current?.classList.add('sat-picking-mode-panel');
    rulesPanelRef.current?.classList.add('sat-picking-mode-panel');
    document.body.style.cursor = 'crosshair';

    document.addEventListener('mouseover', handlePickingHover, { capture: true });
    document.addEventListener('click', handlePickingClick, { capture: true });
    document.addEventListener('keydown', handleKeyEvent, { capture: true });
    document.addEventListener('keyup', handleKeyEvent, { capture: true });

    return () => {
      panelContainerRef.current?.classList.remove('sat-picking-mode-panel');
      rulesPanelRef.current?.classList.remove('sat-picking-mode-panel');
      document.body.style.cursor = 'default';
      const { lastHoveredElement } = useAppStore.getState();
      if (lastHoveredElement) {
        lastHoveredElement.classList.remove('sat-highlight-pick');
        setLastHoveredElement(null);
      }

      document.removeEventListener('mouseover', handlePickingHover, { capture: true });
      document.removeEventListener('click', handlePickingClick, { capture: true });
      document.removeEventListener('keydown', handleKeyEvent, { capture: true });
      document.removeEventListener('keyup', handleKeyEvent, { capture: true });
    };
  }, [isPicking, panelContainerRef, rulesPanelRef, setIsPicking, setLastHoveredElement]);

  return { startPicking };
};
