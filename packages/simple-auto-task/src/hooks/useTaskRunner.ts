import { delay } from 'es-toolkit';
import $ from 'jquery';
import { useCallback, useEffect, useRef } from 'react';

import { ActionType as ActionTypeConst, HighlightState as HighlightStateConst, StatusState as StatusStateConst } from '../app/constants';
import { useAppStore } from '../stores/appStore';

import type { Rule } from '../app/types';

interface UseTaskRunnerProps {
  readonly cycleDelay: number;
  readonly onTimeout: () => void;
  readonly stepDelay: number;
  readonly waitDelay: number;
}

interface UseTaskRunnerReturn {
  readonly start: () => void;
  readonly stop: () => void;
}

export const useTaskRunner = ({ cycleDelay, onTimeout, stepDelay, waitDelay }: UseTaskRunnerProps): UseTaskRunnerReturn => {
  const isRunning = useAppStore((state) => state.isRunning);
  const selectorList = useAppStore((state) => state.selectorList);
  const setHighlightState = useAppStore((state) => state.setHighlightState);
  const setHighlightedRuleIndex = useAppStore((state) => state.setHighlightedRuleIndex);
  const setIsRunning = useAppStore((state) => state.setIsRunning);
  const setStatus = useAppStore((state) => state.setStatus);

  const delaysRef = useRef<{ stepDelay: number; waitDelay: number; cycleDelay: number }>({ stepDelay, waitDelay, cycleDelay });

  useEffect(() => {
    delaysRef.current = { stepDelay, waitDelay, cycleDelay };
  }, [stepDelay, waitDelay, cycleDelay]);

  const executeRuleAction: (rule: Rule) => void = useCallback((rule: Rule) => {
    const element = $(rule.selector);
    if (element.length === 0) {
      return;
    }

    switch (rule.action) {
      case ActionTypeConst.CLICK: {
        element[0].scrollIntoView({
          block: 'center',
        });
        element[0].dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
          }),
        );
        break;
      }
      case ActionTypeConst.DELETE: {
        const { customDeleteSelector, deleteActionType, parentSelector } = rule.options;
        if (deleteActionType === 'self') {
          element.remove();
        } else if (deleteActionType === 'parent' && parentSelector) {
          element.closest(parentSelector)?.remove();
        } else if (deleteActionType === 'custom' && customDeleteSelector) {
          $(customDeleteSelector).each((_: number, el: HTMLElement) => {
            $(el).remove();
          });
        }
        break;
      }
    }
  }, []);

  const waitForElement: (rule: Rule, timeoutMs: number) => Promise<boolean> = useCallback(async (rule: Rule, timeoutMs: number): Promise<boolean> => {
    if ($(rule.selector).length > 0) {
      return true;
    }

    if (rule.options.ignoreWait) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const observer = new MutationObserver(() => {
        if ($(rule.selector).length > 0) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeoutMs);
    });
  }, []);

  const runCycle: () => Promise<void> = useCallback(async () => {
    while (useAppStore.getState().isRunning) {
      for (const [index, rule] of useAppStore.getState().selectorList.entries()) {
        if (!useAppStore.getState().isRunning) return;

        setHighlightedRuleIndex(index);
        setHighlightState(HighlightStateConst.WAITING);

        const timeoutMs: number = delaysRef.current.waitDelay;
        const elementFound: boolean = await waitForElement(rule, timeoutMs);

        if (!useAppStore.getState().isRunning) return;

        if (elementFound) {
          executeRuleAction(rule);
          setHighlightState(HighlightStateConst.SUCCESS);
        } else if (!rule.options.ignoreWait) {
          onTimeout();
          return;
        }

        if (!rule.options.ignoreWait) {
          await delay(delaysRef.current.stepDelay);
        }

        setHighlightState(HighlightStateConst.IDLE);
        setHighlightedRuleIndex(null);
      }

      if (useAppStore.getState().isRunning) {
        await delay(delaysRef.current.cycleDelay);
      }
    }
  }, [executeRuleAction, onTimeout, setHighlightState, setHighlightedRuleIndex, waitForElement]);

  const start: () => void = useCallback(() => {
    if (selectorList.length === 0 || isRunning) return;
    setIsRunning(true);
    setStatus(StatusStateConst.RUNNING);
  }, [isRunning, selectorList.length, setIsRunning, setStatus]);

  const stop: () => void = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    setStatus(StatusStateConst.STOPPED);
  }, [isRunning, setIsRunning, setStatus]);

  useEffect(() => {
    let isCancelled: boolean = false;
    if (isRunning) {
      const cycle = async (): Promise<void> => {
        if (!isCancelled) {
          await runCycle();
        }
      };
      cycle();
    }
    return () => {
      isCancelled = true;
    };
  }, [isRunning, runCycle]);

  return { start, stop };
};
