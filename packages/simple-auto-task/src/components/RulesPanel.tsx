import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { ActionType as ActionTypeConst } from '../app/constants';

import type { KeyboardEvent, RefObject } from 'react';
import type { ActionType, DeleteActionType, Rule } from '../app/types';

interface RulesPanelProps {
  readonly editingRule: Rule | null;
  readonly editingRuleIndex: number;
  readonly onCloseRules: () => void;
  readonly onSaveRule: (rule: Rule) => void;
  readonly onTestSelector: (selector: string, inputEl: HTMLInputElement | null) => void;
  readonly rulesPanelRef: RefObject<HTMLDivElement | null>;
  readonly startPicking: (onElementPicked: (selector: string) => void) => void;
}

const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void => {
  event.stopPropagation();
};

export const RulesPanel = memo<RulesPanelProps>(
  ({ editingRule, editingRuleIndex, onCloseRules, onSaveRule, onTestSelector, rulesPanelRef, startPicking }) => {
    const [action, setAction] = useState<ActionType>(ActionTypeConst.CLICK);
    const [customSelector, setCustomSelector] = useState<string>('');
    const [deleteActionType, setDeleteActionType] = useState<DeleteActionType>('self');
    const [ignoreWait, setIgnoreWait] = useState<boolean>(false);
    const [parentSelector, setParentSelector] = useState<string>('');
    const [selector, setSelector] = useState<string>('');

    const selectorInputRef = useRef<HTMLInputElement | null>(null);
    const parentSelectorInputRef = useRef<HTMLInputElement | null>(null);
    const customSelectorInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (editingRule) {
        setAction(editingRule.action);
        setCustomSelector(editingRule.options.customSelector || '');
        setDeleteActionType(editingRule.options.deleteActionType || 'self');
        setIgnoreWait(editingRule.options.ignoreWait || false);
        setParentSelector(editingRule.options.parentSelector || '');
        setSelector(editingRule.selector);
      }
    }, [editingRule]);

    const handlePick = useCallback(() => {
      startPicking((newSelector: string) => {
        setSelector(newSelector);
      });
    }, [startPicking]);

    const handlePickParentSelector = useCallback(() => {
      startPicking((newSelector: string) => {
        setParentSelector(newSelector);
      });
    }, [startPicking]);

    const handlePickCustomSelector = useCallback(() => {
      startPicking((newSelector: string) => {
        setCustomSelector(newSelector);
      });
    }, [startPicking]);

    const handleSave = useCallback(() => {
      if (!editingRule) {
        return;
      }

      const updatedOptions: {
        ignoreWait: boolean;
        deleteActionType?: DeleteActionType;
        parentSelector?: string;
        customSelector?: string;
      } = {
        ignoreWait,
      };

      if (action === ActionTypeConst.DELETE) {
        updatedOptions.deleteActionType = deleteActionType;
        if (deleteActionType === 'parent') {
          updatedOptions.parentSelector = parentSelector;
        } else if (deleteActionType === 'custom') {
          updatedOptions.customSelector = customSelector;
        }
      }

      const updatedRule: Rule = {
        id: editingRule.id,
        action,
        selector,
        options: updatedOptions,
      };

      onSaveRule(updatedRule);
    }, [action, customSelector, deleteActionType, editingRule, ignoreWait, onSaveRule, parentSelector, selector]);

    const handleTest = useCallback(() => {
      onTestSelector(selector, selectorInputRef.current);
    }, [onTestSelector, selector]);

    const isDeleteAction: boolean = action === ActionTypeConst.DELETE;

    return (
      <div id="rules-panel" ref={rulesPanelRef} style={{ display: editingRule ? 'block' : 'none' }}>
        <div id="rules-panel-header" className="panel-header">
          <span>{editingRule ? `Configure Rule #${editingRuleIndex + 1}` : 'Rule Configuration'}</span>
        </div>
        <div className="panel-body">
          <label className="panel-label">
            jQuery Selector
            <input
              ref={selectorInputRef}
              className="panel-input"
              id="rules-selector-input"
              placeholder="Enter selector"
              style={{ marginBottom: '4px' }}
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="btn-group">
              <button id="rules-pick-btn" className="panel-button" title="Pick an element from the page" onClick={handlePick}>
                Pick
              </button>
              <button id="rules-test-btn" className="panel-button" title="Test the current selector" onClick={handleTest}>
                Test
              </button>
            </div>
          </label>

          <label className="panel-label">
            Action
            <select
              id="rules-panel-action"
              className="panel-select"
              value={action}
              onChange={(e) => setAction(e.target.value as ActionType)}
              onKeyDown={handleKeyDown}
            >
              <option value={ActionTypeConst.CLICK}>Click Element</option>
              <option value={ActionTypeConst.DELETE}>Delete Element(s)</option>
              <option value={ActionTypeConst.STOP}>Stop Task</option>
            </select>
          </label>

          {isDeleteAction && (
            <>
              <label id="rules-panel-delete-type-label" className="panel-label">
                Delete Type
                <select
                  id="rules-panel-delete-type"
                  className="panel-select"
                  value={deleteActionType}
                  onChange={(e) => setDeleteActionType(e.target.value as DeleteActionType)}
                  onKeyDown={handleKeyDown}
                >
                  <option value="self">Delete Self</option>
                  <option value="parent">Delete Parent</option>
                  <option value="custom">Delete Custom</option>
                </select>
              </label>
              {deleteActionType === 'parent' && (
                <label id="rules-panel-parent-label" className="panel-label">
                  Parent Selector
                  <input
                    ref={parentSelectorInputRef}
                    id="rules-parent-input"
                    className="panel-input"
                    style={{ marginBottom: '4px' }}
                    type="text"
                    value={parentSelector}
                    placeholder="e.g., .card, #container"
                    onChange={(e) => setParentSelector(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="btn-group">
                    <button id="rules-parent-pick-btn" className="panel-button" title="Pick Parent Element" onClick={handlePickParentSelector}>
                      Pick
                    </button>
                    <button
                      id="rules-parent-test-btn"
                      className="panel-button"
                      title="Test Parent Selector"
                      onClick={() => onTestSelector(parentSelector, parentSelectorInputRef.current)}
                    >
                      Test
                    </button>
                  </div>
                </label>
              )}
              {deleteActionType === 'custom' && (
                <label id="rules-panel-custom-label" className="panel-label">
                  Custom Selector
                  <input
                    ref={customSelectorInputRef}
                    id="rules-custom-input"
                    className="panel-input"
                    style={{ marginBottom: '4px' }}
                    type="text"
                    value={customSelector}
                    placeholder="e.g., .ad-banner"
                    onChange={(e) => setCustomSelector(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="btn-group">
                    <button id="rules-custom-pick-btn" className="panel-button" title="Pick Custom Element" onClick={handlePickCustomSelector}>
                      Pick
                    </button>
                    <button
                      id="rules-custom-test-btn"
                      className="panel-button"
                      title="Test Custom Selector"
                      onClick={() => onTestSelector(customSelector, customSelectorInputRef.current)}
                    >
                      Test
                    </button>
                  </div>
                </label>
              )}
            </>
          )}

          <label className="panel-label switch-label">
            <span>Ignore wait</span>
            <div className="switch">
              <input id="rules-ignore-wait-checkbox" type="checkbox" checked={ignoreWait} onChange={(e) => setIgnoreWait(e.target.checked)} />
              <span className="switch-slider"></span>
            </div>
          </label>

          <div className="btn-group">
            <button id="rules-panel-save-btn" className="panel-button" onClick={handleSave}>
              Save
            </button>
            <button id="rules-panel-cancel-btn" className="panel-button" onClick={onCloseRules}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  },
);
