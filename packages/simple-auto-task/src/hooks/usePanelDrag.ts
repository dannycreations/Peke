import { clamp } from 'es-toolkit';
import { useEffect } from 'preact/hooks';

import type { RefObject } from 'preact';
import type { Position } from '../app/types';

const PANEL_HEADER_HEIGHT = 30;

interface UsePanelDragProps {
  readonly mainPanelRef: RefObject<HTMLDivElement | null>;
  readonly onDragEnd: (position: Position) => void;
  readonly rulesPanelRef: RefObject<HTMLDivElement | null>;
}

export const usePanelDrag = ({ mainPanelRef, rulesPanelRef, onDragEnd }: UsePanelDragProps): void => {
  useEffect(() => {
    const mainPanel = mainPanelRef.current;
    const rulesPanel = rulesPanelRef.current;
    const mainPanelHeader = mainPanel?.querySelector<HTMLElement>('#panel-header') ?? null;
    const rulesPanelHeader = rulesPanel?.querySelector<HTMLElement>('#rules-panel-header') ?? null;

    if (!mainPanel || !rulesPanel || !mainPanelHeader || !rulesPanelHeader) {
      return;
    }

    let offsetX = 0;
    let offsetY = 0;
    let mainPosition: Position = { top: mainPanel.offsetTop, left: mainPanel.offsetLeft, right: null };

    const isRulesPanelVisible = (): boolean => rulesPanel.style.display !== 'none';

    const captureOffsets = (): void => {
      if (!isRulesPanelVisible()) return;

      const mainRect = mainPanel.getBoundingClientRect();
      const rulesRect = rulesPanel.getBoundingClientRect();
      offsetX = rulesRect.left - mainRect.left;
      offsetY = rulesRect.top - mainRect.top;
    };

    const movePanel = (panel: HTMLElement, top: number, left: number): void => {
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.right = 'auto';
    };

    const dragPanel = (draggedPanel: HTMLElement, deltaX: number, deltaY: number): void => {
      const top = clamp(draggedPanel.offsetTop - deltaY, 0, window.innerHeight - PANEL_HEADER_HEIGHT);
      const left = clamp(
        draggedPanel.offsetLeft - deltaX,
        -draggedPanel.offsetWidth + PANEL_HEADER_HEIGHT * 2,
        window.innerWidth - PANEL_HEADER_HEIGHT * 2,
      );
      movePanel(draggedPanel, top, left);

      if (draggedPanel === mainPanel) {
        mainPosition = { top, left, right: null };
        if (isRulesPanelVisible()) {
          movePanel(rulesPanel, top + offsetY, left + offsetX);
        }
        return;
      }

      const mainTop = top - offsetY;
      const mainLeft = left - offsetX;
      mainPosition = { top: mainTop, left: mainLeft, right: null };
      movePanel(mainPanel, mainTop, mainLeft);
    };

    const makeDraggable = (panel: HTMLElement, header: HTMLElement, onDrag: typeof dragPanel): (() => void) => {
      let dragStartX = 0;
      let dragStartY = 0;

      const handleDragMove = (event: MouseEvent): void => {
        event.preventDefault();
        const deltaX = dragStartX - event.clientX;
        const deltaY = dragStartY - event.clientY;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        onDrag(panel, deltaX, deltaY);
      };

      const handleDragEnd = (): void => {
        stopDragging();
        onDragEnd(mainPosition);
      };

      const stopDragging = (): void => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };

      const handleDragStart = (event: MouseEvent): void => {
        if (!header.contains(event.target as Node)) {
          return;
        }

        event.preventDefault();
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        captureOffsets();
        mainPosition = { top: mainPanel.offsetTop, left: mainPanel.offsetLeft, right: null };

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
      };

      header.addEventListener('mousedown', handleDragStart);

      return () => {
        header.removeEventListener('mousedown', handleDragStart);
        stopDragging();
      };
    };

    const stopMainPanelDrag = makeDraggable(mainPanel, mainPanelHeader, dragPanel);
    const stopRulesPanelDrag = makeDraggable(rulesPanel, rulesPanelHeader, dragPanel);

    return () => {
      stopMainPanelDrag();
      stopRulesPanelDrag();
    };
  }, [mainPanelRef, rulesPanelRef, onDragEnd]);
};
