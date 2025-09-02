import { noop } from 'es-toolkit';
import { RefObject, useCallback, useEffect, useRef } from 'react';

interface UsePanelDragProps {
  readonly mainPanelRef: RefObject<HTMLDivElement | null>;
  readonly onDragEnd: () => void;
  readonly rulesPanelRef: RefObject<HTMLDivElement | null>;
}

export const usePanelDrag = ({ mainPanelRef, rulesPanelRef, onDragEnd }: UsePanelDragProps): void => {
  const initialOffsetX = useRef<number>(0);
  const initialOffsetY = useRef<number>(0);

  const calculateInitialOffsets = useCallback(() => {
    if (mainPanelRef.current && rulesPanelRef.current && rulesPanelRef.current.style.display !== 'none') {
      const userPanelRect = mainPanelRef.current.getBoundingClientRect();
      const rulesPanelRect = rulesPanelRef.current.getBoundingClientRect();
      initialOffsetX.current = rulesPanelRect.left - userPanelRect.left;
      initialOffsetY.current = rulesPanelRect.top - userPanelRect.top;
    }
  }, [mainPanelRef, rulesPanelRef]);

  const handlePanelsDrag = useCallback(
    (draggedElement: HTMLElement, deltaX: number, deltaY: number) => {
      const headerHeight = 30;
      let newTop = draggedElement.offsetTop - deltaY;
      let newLeft = draggedElement.offsetLeft - deltaX;

      newTop = Math.max(0, Math.min(newTop, window.innerHeight - headerHeight));
      newLeft = Math.max(-draggedElement.offsetWidth + headerHeight * 2, Math.min(newLeft, window.innerWidth - headerHeight * 2));

      draggedElement.style.top = `${newTop}px`;
      draggedElement.style.left = `${newLeft}px`;
      draggedElement.style.right = 'auto';

      if (draggedElement === mainPanelRef.current && rulesPanelRef.current && rulesPanelRef.current.style.display !== 'none') {
        rulesPanelRef.current.style.top = `${newTop + initialOffsetY.current}px`;
        rulesPanelRef.current.style.left = `${newLeft + initialOffsetX.current}px`;
        rulesPanelRef.current.style.right = 'auto';
      } else if (draggedElement === rulesPanelRef.current && mainPanelRef.current) {
        mainPanelRef.current.style.top = `${newTop - initialOffsetY.current}px`;
        mainPanelRef.current.style.left = `${newLeft - initialOffsetX.current}px`;
        mainPanelRef.current.style.right = 'auto';
      }
    },
    [mainPanelRef, rulesPanelRef],
  );

  const makeDraggable = useCallback(
    (element: HTMLElement, handle: HTMLElement, onDragCallback: (draggedElement: HTMLElement, deltaX: number, deltaY: number) => void) => {
      let mouseStartX = 0;
      let mouseStartY = 0;

      const handleDragStart = (event: MouseEvent): void => {
        if (event.target !== handle && !handle.contains(event.target as Node)) {
          return;
        }

        event.preventDefault();
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;

        calculateInitialOffsets();

        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('mousemove', handleElementDrag);
      };

      const handleElementDrag = (event: MouseEvent): void => {
        event.preventDefault();
        const deltaX: number = mouseStartX - event.clientX;
        const deltaY: number = mouseStartY - event.clientY;
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;

        onDragCallback(element, deltaX, deltaY);
      };

      const handleDragEnd = (): void => {
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('mousemove', handleElementDrag);
        onDragEnd();
      };

      handle.addEventListener('mousedown', handleDragStart);

      return () => {
        handle.removeEventListener('mousedown', handleDragStart);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('mousemove', handleElementDrag);
      };
    },
    [calculateInitialOffsets, onDragEnd],
  );

  useEffect(() => {
    const mainPanelHeader = mainPanelRef.current?.querySelector('#sat-panel-header') as HTMLElement | null;
    const rulesPanelHeader = rulesPanelRef.current?.querySelector('#sat-rules-panel-header') as HTMLElement | null;

    let cleanupMainPanel = noop;
    let cleanupRulesPanel = noop;

    if (mainPanelRef.current && mainPanelHeader) {
      cleanupMainPanel = makeDraggable(mainPanelRef.current, mainPanelHeader, handlePanelsDrag);
    }
    if (rulesPanelRef.current && rulesPanelHeader) {
      cleanupRulesPanel = makeDraggable(rulesPanelRef.current, rulesPanelHeader, handlePanelsDrag);
    }
    return () => {
      cleanupMainPanel();
      cleanupRulesPanel();
    };
  }, [mainPanelRef, rulesPanelRef, makeDraggable, handlePanelsDrag]);
};
