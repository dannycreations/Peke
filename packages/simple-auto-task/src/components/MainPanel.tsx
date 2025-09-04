import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';

import { HIGHLIGHT_BG_COLORS, HIGHLIGHT_TEXT_COLORS, STATUS_COLORS, STATUS_TEXTS } from '../app/constants';

import type { ChangeEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import type { HighlightState, Rule, StatusState } from '../app/types';

interface MainPanelProps {
  readonly cycleDelay: number;
  readonly highlightState: HighlightState;
  readonly highlightedRuleIndex: number | null;
  readonly isAutoRun: boolean;
  readonly isRunning: boolean;
  readonly onAddSelector: () => void;
  readonly onConfigChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onListClick: (event: MouseEvent<HTMLDivElement>) => void;
  readonly onPick: () => void;
  readonly onStart: () => void;
  readonly onStop: () => void;
  readonly onTestSelector: () => void;
  readonly selectorInputRef: RefObject<HTMLInputElement | null>;
  readonly selectorList: ReadonlyArray<Rule>;
  readonly status: StatusState;
  readonly stepDelay: number;
  readonly waitDelay: number;
}

interface DelayConfig {
  readonly id: string;
  readonly name: 'stepDelay' | 'waitDelay' | 'cycleDelay';
  readonly label: string;
  readonly min: number;
  readonly step: number;
  readonly value: number;
}

const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
  event.stopPropagation();
};

export const MainPanel = memo(
  forwardRef<HTMLDivElement, MainPanelProps>(
    (
      {
        cycleDelay,
        highlightState,
        highlightedRuleIndex,
        isAutoRun,
        isRunning,
        onAddSelector,
        onConfigChange,
        onListClick,
        onPick,
        onStart,
        onStop,
        onTestSelector,
        selectorInputRef,
        selectorList,
        status,
        stepDelay,
        waitDelay,
      },
      ref,
    ) => {
      const listDisplayRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        if (isRunning && highlightedRuleIndex !== null && listDisplayRef.current) {
          const itemElement = listDisplayRef.current.children[highlightedRuleIndex] as HTMLElement;
          if (itemElement) {
            itemElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      }, [isRunning, highlightedRuleIndex]);

      const delayConfigs = useMemo<ReadonlyArray<DelayConfig>>(
        () => [
          { id: 'step-delay', name: 'stepDelay', label: 'Step Delay (ms)', min: 0, step: 10, value: stepDelay },
          { id: 'wait-delay', name: 'waitDelay', label: 'Wait Delay (ms)', min: 1000, step: 100, value: waitDelay },
          { id: 'cycle-delay', name: 'cycleDelay', label: 'Cycle Delay (ms)', min: 100, step: 100, value: cycleDelay },
        ],
        [stepDelay, waitDelay, cycleDelay],
      );

      return (
        <div id="panel-container" ref={ref}>
          <div id="panel-header" className="panel-header">
            <span>Simple Auto Task</span>
            <span id="status-indicator">
              <span id="status-dot" style={{ backgroundColor: STATUS_COLORS[status] }}></span>
              <span id="status-text">{STATUS_TEXTS[status]}</span>
            </span>
          </div>

          <div className="panel-body">
            <label className="panel-label">
              jQuery Selector
              <input
                ref={selectorInputRef}
                className="panel-input"
                id="selector-input"
                placeholder="Click 'Pick' or enter selector"
                style={{ marginBottom: '4px' }}
                type="text"
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  if (e.key === 'Enter') {
                    onAddSelector();
                  }
                }}
              />
              <div className="btn-group">
                <button id="picker-btn" className="panel-button" onClick={onPick}>
                  Pick
                </button>
                <button id="test-selector-btn" className="panel-button" onClick={onTestSelector}>
                  Test
                </button>
                <button id="add-selector-btn" className="panel-button" onClick={onAddSelector}>
                  Add
                </button>
              </div>
            </label>

            <div id="selector-list-display" ref={listDisplayRef} onClick={onListClick}>
              {selectorList.length === 0 ? (
                <div id="no-rules-message">No rules yet. Add one above.</div>
              ) : (
                selectorList.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="selector-item"
                    style={{
                      backgroundColor: highlightedRuleIndex === index ? HIGHLIGHT_BG_COLORS[highlightState] : '',
                      color: highlightedRuleIndex === index ? HIGHLIGHT_TEXT_COLORS[highlightState] : '',
                    }}
                  >
                    <span className="selector-text" title={rule.selector}>
                      {index + 1}. {rule.selector}
                    </span>
                    <div className="btn-group">
                      <button className="selector-item-btn selector-item-config-btn" data-rule-id={rule.id} title={`Configure rule ${index + 1}`}>
                        &#9881;
                      </button>
                      <button className="selector-item-btn selector-item-remove-btn" data-rule-id={rule.id} title={`Remove rule ${index + 1}`}>
                        &times;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {delayConfigs.map((config) => (
              <label key={config.name} className="panel-label">
                {config.label}
                <input
                  className="panel-input"
                  id={`${config.id}-input`}
                  min={config.min}
                  name={config.name}
                  step={config.step}
                  type="number"
                  value={config.value}
                  onChange={onConfigChange}
                  onKeyDown={handleKeyDown}
                />
              </label>
            ))}

            <div className="btn-group">
              <button id="start-btn" className="panel-button" disabled={isRunning || isAutoRun || selectorList.length === 0} onClick={onStart}>
                Start
              </button>
              <button id="stop-btn" className="panel-button" disabled={!isRunning && !isAutoRun} onClick={onStop}>
                Stop
              </button>
            </div>
          </div>
        </div>
      );
    },
  ),
);
