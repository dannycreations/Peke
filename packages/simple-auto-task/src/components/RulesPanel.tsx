import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { ActionType as ActionTypeConst } from '../app/constants';

import type { KeyboardEvent, RefObject } from 'react';
import type { ActionType, DeleteActionType, Rule, RuleOptions } from '../app/types';

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
    const [customSelector, setcustomSelector] = useState<string>('');
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
        setcustomSelector(editingRule.options.customSelector || '');
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

    const handlePickcustomSelector = useCallback(() => {
      startPicking((newSelector: string) => {
        setcustomSelector(newSelector);
      });
    }, [startPicking]);

    const handleSave = useCallback(() => {
      if (!editingRule) {
        return;
      }

      const {
        deleteActionType: _deleteActionType,
        parentSelector: _parentSelector,
        customSelector: _customSelector,
        ...baseOptions
      } = editingRule.options;

      let updatedOptions: RuleOptions = {
        ...baseOptions,
        ignoreWait,
      };

      if (action === ActionTypeConst.DELETE) {
        updatedOptions = {
          ...updatedOptions,
          deleteActionType,
        };
        if (deleteActionType === 'parent') {
          updatedOptions = { ...updatedOptions, parentSelector };
        } else if (deleteActionType === 'custom') {
          updatedOptions = { ...updatedOptions, customSelector };
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
      <div id="sat-rules-panel" ref={rulesPanelRef} style={{ display: editingRule ? 'block' : 'none' }}>
        <div id="sat-rules-panel-header" className="sat-panel-header">
          <span>{editingRule ? `Configure Rule #${editingRuleIndex + 1}` : 'Rule Configuration'}</span>
        </div>
        <div className="sat-panel-body">
          <label className="sat-panel-label">
            jQuery Selector
            <input
              ref={selectorInputRef}
              className="sat-panel-input"
              id="sat-rules-selector-input"
              placeholder="Enter selector"
              style={{ marginBottom: '4px' }}
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="sat-btn-group">
              <button id="sat-rules-pick-btn" className="sat-panel-button" title="Pick an element from the page" onClick={handlePick}>
                Pick
              </button>
              <button id="sat-rules-test-btn" className="sat-panel-button" title="Test the current selector" onClick={handleTest}>
                Test
              </button>
            </div>
          </label>

          <label className="sat-panel-label">
            Action
            <select
              id="sat-rules-panel-action"
              className="sat-panel-select"
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
              <label id="sat-rules-panel-delete-type-label" className="sat-panel-label">
                Delete Type
                <select
                  id="sat-rules-panel-delete-type"
                  className="sat-panel-select"
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
                <label id="sat-rules-panel-parent-label" className="sat-panel-label">
                  Parent Selector
                  <input
                    ref={parentSelectorInputRef}
                    id="sat-rules-parent-input"
                    className="sat-panel-input"
                    style={{ marginBottom: '4px' }}
                    type="text"
                    value={parentSelector}
                    placeholder="e.g., .card, #container"
                    onChange={(e) => setParentSelector(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="sat-btn-group">
                    <button
                      id="sat-rules-parent-pick-btn"
                      className="sat-panel-button"
                      title="Pick Parent Element"
                      onClick={handlePickParentSelector}
                    >
                      Pick
                    </button>
                    <button
                      id="sat-rules-parent-test-btn"
                      className="sat-panel-button"
                      title="Test Parent Selector"
                      onClick={() => onTestSelector(parentSelector, parentSelectorInputRef.current)}
                    >
                      Test
                    </button>
                  </div>
                </label>
              )}
              {deleteActionType === 'custom' && (
                <label id="sat-rules-panel-custom-label" className="sat-panel-label">
                  Custom Selector
                  <input
                    ref={customSelectorInputRef}
                    id="sat-rules-custom-input"
                    className="sat-panel-input"
                    style={{ marginBottom: '4px' }}
                    type="text"
                    value={customSelector}
                    placeholder="e.g., .ad-banner"
                    onChange={(e) => setcustomSelector(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="sat-btn-group">
                    <button
                      id="sat-rules-custom-pick-btn"
                      className="sat-panel-button"
                      title="Pick Custom Element"
                      onClick={handlePickcustomSelector}
                    >
                      Pick
                    </button>
                    <button
                      id="sat-rules-custom-test-btn"
                      className="sat-panel-button"
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

          <label className="sat-panel-label sat-switch-label">
            <span>Ignore wait</span>
            <div className="sat-switch">
              <input id="sat-rules-ignore-wait-checkbox" type="checkbox" checked={ignoreWait} onChange={(e) => setIgnoreWait(e.target.checked)} />
              <span className="sat-switch-slider"></span>
            </div>
          </label>

          <div className="sat-btn-group">
            <button id="sat-rules-panel-save-btn" className="sat-panel-button" onClick={handleSave}>
              Save
            </button>
            <button id="sat-rules-panel-cancel-btn" className="sat-panel-button" onClick={onCloseRules}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  },
);
