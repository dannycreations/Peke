import { ChangeEvent, KeyboardEvent, memo, MouseEvent, RefObject, useMemo } from 'react';

import { HIGHLIGHT_BG_COLORS, HIGHLIGHT_TEXT_COLORS, STATUS_COLORS, STATUS_TEXTS } from '../app/constants';

import type { HighlightState, Rule, StatusState } from '../app/types';

interface MainPanelProps {
  readonly cycleDelay: number;
  readonly highlightState: HighlightState;
  readonly highlightedRuleIndex: number | null;
  readonly isRunning: boolean;
  readonly onAddSelector: () => void;
  readonly onConfigChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onListClick: (event: MouseEvent<HTMLDivElement>) => void;
  readonly onPick: () => void;
  readonly onStart: () => void;
  readonly onStop: () => void;
  readonly onTestSelector: () => void;
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly selectorInputRef: RefObject<HTMLInputElement | null>;
  readonly selectorList: ReadonlyArray<Rule>;
  readonly status: StatusState;
  readonly stepDelay: number;
  readonly waitDelay: number;
}

type DelayConfig = {
  readonly id: string;
  readonly name: 'stepDelay' | 'waitDelay' | 'cycleDelay';
  readonly label: string;
  readonly min: number;
  readonly step: number;
  readonly value: number;
};

const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
  event.stopPropagation();
};

export const MainPanel = memo<MainPanelProps>(
  ({
    cycleDelay,
    highlightState,
    highlightedRuleIndex,
    isRunning,
    onAddSelector,
    onConfigChange,
    onListClick,
    onPick,
    onStart,
    onStop,
    onTestSelector,
    ref,
    selectorInputRef,
    selectorList,
    status,
    stepDelay,
    waitDelay,
  }) => {
    const delayConfigs: ReadonlyArray<DelayConfig> = useMemo(
      () => [
        { id: 'step-delay', name: 'stepDelay', label: 'Step Delay (ms)', min: 0, step: 10, value: stepDelay },
        { id: 'wait-delay', name: 'waitDelay', label: 'Wait Delay (ms)', min: 1000, step: 100, value: waitDelay },
        { id: 'cycle-delay', name: 'cycleDelay', label: 'Cycle Delay (ms)', min: 100, step: 100, value: cycleDelay },
      ],
      [stepDelay, waitDelay, cycleDelay],
    );

    return (
      <div id="sat-panel-container" ref={ref}>
        <div id="sat-panel-header" className="sat-panel-header">
          <span>Simple Auto Task</span>
          <span id="sat-status-indicator">
            <span id="sat-status-dot" style={{ backgroundColor: STATUS_COLORS[status] }}></span>
            <span id="sat-status-text">{STATUS_TEXTS[status]}</span>
          </span>
        </div>

        <div className="sat-panel-body">
          <label className="sat-panel-label">
            jQuery Selector
            <input
              ref={selectorInputRef}
              className="sat-panel-input"
              id="sat-selector-input"
              placeholder="Click 'Pick' or enter selector"
              style={{ marginBottom: '4px' }}
              type="text"
              onKeyDown={handleKeyDown}
            />
            <div className="sat-btn-group">
              <button id="sat-picker-btn" className="sat-panel-button" onClick={onPick}>
                Pick
              </button>
              <button id="sat-test-selector-btn" className="sat-panel-button" onClick={onTestSelector}>
                Test
              </button>
              <button id="sat-add-selector-btn" className="sat-panel-button" onClick={onAddSelector}>
                Add
              </button>
            </div>
          </label>

          <div id="sat-selector-list-display" onClick={onListClick}>
            {selectorList.map((rule, index) => (
              <div
                key={rule.id}
                className="sat-selector-item"
                style={{
                  backgroundColor: highlightedRuleIndex === index ? HIGHLIGHT_BG_COLORS[highlightState] : '',
                  color: highlightedRuleIndex === index ? HIGHLIGHT_TEXT_COLORS[highlightState] : '',
                }}
              >
                <span className="sat-selector-text" title={rule.selector}>
                  {index + 1}. {rule.selector}
                </span>
                <div className="sat-btn-group">
                  <button
                    aria-label={`Configure rule ${index + 1}`}
                    className="sat-selector-item-btn sat-selector-item-config-btn"
                    data-rule-id={rule.id}
                  >
                    &#9881;
                  </button>
                  <button
                    aria-label={`Remove rule ${index + 1}`}
                    className="sat-selector-item-btn sat-selector-item-remove-btn"
                    data-rule-id={rule.id}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {delayConfigs.map((config) => (
            <label key={config.name} className="sat-panel-label">
              {config.label}
              <input
                className="sat-panel-input"
                id={`sat-${config.id}-input`}
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

          <div className="sat-btn-group">
            <button id="sat-start-btn" className="sat-panel-button" disabled={isRunning || selectorList.length === 0} onClick={onStart}>
              Start
            </button>
            <button id="sat-stop-btn" className="sat-panel-button" disabled={!isRunning} onClick={onStop}>
              Stop
            </button>
          </div>
        </div>
      </div>
    );
  },
);
