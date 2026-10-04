import { batch } from '@preact/signals';
import $ from 'jquery';
import { memo } from 'preact/compat';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';

import { MainPanel } from '../components/MainPanel';
import { RulesPanel } from '../components/RulesPanel';
import { useConfigPersistence } from '../hooks/useConfigPersistence';
import { useElementPicker } from '../hooks/useElementPicker';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { useTaskRunner } from '../hooks/useTaskRunner';
import {
  addRule,
  editingRuleId,
  highlightedRuleIndex,
  highlightState,
  isAutoRun,
  isPicking,
  isRunning,
  removeRule,
  selectorList,
  status,
  updateRule,
} from '../stores/useStore';
import { getStorage } from '../utilities/storage';
import { ActionType, PANEL_SPACING, StatusState, STORAGE_AUTORUN_KEY } from './constants';

import type { CSSProperties } from 'preact';
import type { DelayKey, Position, Rule } from './types';

const PickerClue = memo(() => {
  return (
    <div id="picker-clue">
      Click to select an element. Hold <strong>Ctrl</strong> to pause. Press <strong>Esc</strong> to cancel.
    </div>
  );
});

export const App = memo(() => {
  const storage = getStorage();
  const panelContainerRef = useRef<HTMLDivElement | null>(null);
  const rulesPanelRef = useRef<HTMLDivElement | null>(null);
  const selectorInputRef = useRef<HTMLInputElement | null>(null);
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  const { config, saveConfigNow, updateConfig } = useConfigPersistence();

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      await wakeLockSentinelRef.current.release();
      wakeLockSentinelRef.current = null;
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinelRef.current = await navigator.wakeLock.request('screen');
        wakeLockSentinelRef.current.addEventListener('release', () => {
          wakeLockSentinelRef.current = null;
        });
      } catch (error) {
        console.error('Could not acquire wake lock:', error);
      }
    }
  }, []);

  const onTimeout = useCallback(() => {
    isRunning.value = false;
    saveConfigNow();
    storage.setItem(STORAGE_AUTORUN_KEY, 'true');
    window.location.reload();
  }, [saveConfigNow, storage]);

  const { start: startRunner, stop: stopRunner } = useTaskRunner({
    cycleDelay: config.cycleDelay,
    stepDelay: config.stepDelay,
    waitDelay: config.waitDelay,
    onTimeout,
  });

  const { startPicking } = useElementPicker({
    panelContainerRef,
    rulesPanelRef,
  });

  const handleDragEnd = useCallback(
    (position: Position) => {
      updateConfig({ position });
    },
    [updateConfig],
  );

  usePanelDrag({
    mainPanelRef: panelContainerRef,
    onDragEnd: handleDragEnd,
    rulesPanelRef,
  });

  const editingRuleIndex = editingRuleId.value === null ? -1 : selectorList.value.findIndex((rule) => rule.id === editingRuleId.value);
  const editingRule = editingRuleIndex === -1 ? null : selectorList.value[editingRuleIndex];

  const handleAddSelector = useCallback(() => {
    const newSelector = selectorInputRef.current?.value.trim();
    if (!newSelector) {
      selectorInputRef.current?.focus();
      return;
    }

    addRule({
      action: ActionType.CLICK,
      options: {
        ignoreWait: false,
      },
      selector: newSelector,
    });

    if (selectorInputRef.current) {
      selectorInputRef.current.value = '';
      selectorInputRef.current.focus();
    }
  }, []);

  const handleCloseRules = useCallback(() => {
    editingRuleId.value = null;
  }, []);

  const handleConfigChange = useCallback(
    (name: DelayKey, value: string) => {
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue)) {
        updateConfig({ [name]: numericValue });
      }
    },
    [updateConfig],
  );

  const handleListClick = useCallback(
    (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('.selector-item-btn') as HTMLElement | null;
      if (!target) {
        return;
      }

      const ruleId = Number(target.dataset['ruleId']);
      if (isNaN(ruleId)) {
        return;
      }

      if (target.classList.contains('selector-item-remove-btn')) {
        if (editingRuleId.value === ruleId) {
          handleCloseRules();
        }
        removeRule(ruleId);
        return;
      }

      if (!target.classList.contains('selector-item-config-btn')) {
        return;
      }

      if (editingRuleId.value === ruleId) {
        handleCloseRules();
        return;
      }

      if (!selectorList.value.some((rule) => rule.id === ruleId) || !panelContainerRef.current || !rulesPanelRef.current) {
        return;
      }

      editingRuleId.value = ruleId;
      const panelRect = panelContainerRef.current.getBoundingClientRect();
      rulesPanelRef.current.style.top = `${panelRect.top}px`;
      rulesPanelRef.current.style.left = `${panelRect.left + panelRect.width + PANEL_SPACING}px`;
      rulesPanelRef.current.style.right = 'auto';
    },
    [handleCloseRules],
  );

  const handleMainPanelPick = useCallback(() => {
    startPicking((selector: string) => {
      if (selectorInputRef.current) {
        selectorInputRef.current.value = selector;
      }
    });
  }, [startPicking]);

  const testSelector = useCallback((selector: string | undefined, inputEl: HTMLInputElement | null) => {
    if (!inputEl) {
      return;
    }

    const flash = (className: string) => {
      inputEl.classList.add(className);
      setTimeout(() => {
        inputEl.classList.remove(className);
      }, 1500);
    };

    inputEl.classList.remove('input-error', 'input-success');

    if (!selector) {
      flash('input-error');
      return;
    }

    try {
      const element = $(selector).first()[0];
      if (!element) {
        flash('input-error');
        return;
      }

      flash('input-success');
      const originalOutline = element.style.outline;
      element.style.outline = '2px solid #22c55e';
      setTimeout(() => (element.style.outline = originalOutline), 1500);
    } catch {
      flash('input-error');
    }
  }, []);

  const handleMainPanelTestSelector = useCallback(() => {
    testSelector(selectorInputRef.current?.value.trim(), selectorInputRef.current);
  }, [testSelector]);

  const handleSaveRule = useCallback(
    (updatedRule: Rule) => {
      updateRule(updatedRule);
      handleCloseRules();
    },
    [handleCloseRules],
  );

  const handleStart = useCallback(() => {
    acquireWakeLock();
    startRunner();
    storage.setItem(STORAGE_AUTORUN_KEY, 'true');
  }, [startRunner, acquireWakeLock, storage]);

  const handleStop = useCallback(() => {
    releaseWakeLock();
    stopRunner();
    batch(() => {
      isAutoRun.value = false;
      status.value = StatusState.STOPPED;
    });
    storage.setItem(STORAGE_AUTORUN_KEY, 'false');
  }, [stopRunner, releaseWakeLock, storage]);

  useEffect((): void | (() => void) => {
    if (isRunning.value) {
      return;
    }

    if (storage.getItem(STORAGE_AUTORUN_KEY) !== 'true') {
      return;
    }

    batch(() => {
      isAutoRun.value = true;
      status.value = StatusState.WAITING;
    });

    const startWhenReady = () => {
      if (!isAutoRun.value || isRunning.value) {
        return;
      }

      startRunner();
      isAutoRun.value = false;
    };

    if (document.readyState === 'complete') {
      startWhenReady();
    } else {
      const onLoad = () => {
        startWhenReady();
        window.removeEventListener('load', onLoad);
      };
      window.addEventListener('load', onLoad);

      return () => {
        window.removeEventListener('load', onLoad);
      };
    }
  }, [startRunner]);

  const mainPanelStyle = useMemo<CSSProperties>(() => {
    const { top, left, right } = config.position;
    return {
      top: `${top}px`,
      left: left !== null ? `${left}px` : 'auto',
      right: left !== null || right === null ? 'auto' : `${right}px`,
    };
  }, [config.position]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        return;
      }

      if (event.key === '`') {
        updateConfig({ visible: !config.visible });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [config.visible, updateConfig]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return (
    <>
      <div style={{ visibility: config.visible ? 'visible' : 'hidden', pointerEvents: config.visible ? 'auto' : 'none' }}>
        <MainPanel
          mainPanelRef={panelContainerRef}
          style={mainPanelStyle}
          cycleDelay={config.cycleDelay}
          highlightState={highlightState.value}
          highlightedRuleIndex={highlightedRuleIndex.value}
          isAutoRun={isAutoRun.value}
          isRunning={isRunning.value}
          onAddSelector={handleAddSelector}
          onConfigChange={handleConfigChange}
          onListClick={handleListClick}
          onPick={handleMainPanelPick}
          onStart={handleStart}
          onStop={handleStop}
          onTestSelector={handleMainPanelTestSelector}
          selectorInputRef={selectorInputRef}
          selectorList={selectorList.value}
          status={status.value}
          stepDelay={config.stepDelay}
          waitDelay={config.waitDelay}
        />
        <RulesPanel
          editingRule={editingRule}
          editingRuleIndex={editingRuleIndex}
          onCloseRules={handleCloseRules}
          onSaveRule={handleSaveRule}
          onTestSelector={testSelector}
          rulesPanelRef={rulesPanelRef}
          startPicking={startPicking}
        />
      </div>
      {isPicking.value && <PickerClue />}
    </>
  );
});
