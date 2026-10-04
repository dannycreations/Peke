import { signal } from '@preact/signals';

import { HighlightState, StatusState } from '../app/constants';

import type { ActionType } from '../app/constants';
import type { Rule, RuleOptions } from '../app/types';

export const editingRuleId = signal<number | null>(null);
export const highlightState = signal<HighlightState>(HighlightState.IDLE);
export const highlightedRuleIndex = signal<number | null>(null);
export const isAutoRun = signal<boolean>(false);
export const isPicking = signal<boolean>(false);
export const isRunning = signal<boolean>(false);
export const lastHoveredElement = signal<Element | null>(null);
export const selectorList = signal<ReadonlyArray<Rule>>([]);
export const status = signal<StatusState>(StatusState.IDLE);

interface AddRulePayload {
  readonly action: ActionType;
  readonly options: Readonly<Pick<RuleOptions, 'ignoreWait'>>;
  readonly selector: string;
}

let lastRuleId = 0;

export function addRule(newRuleData: AddRulePayload): void {
  selectorList.value = selectorList.value.concat({ ...newRuleData, id: ++lastRuleId });
}

export function removeRule(idToRemove: number): void {
  selectorList.value = selectorList.value.filter((rule) => rule.id !== idToRemove);
}

export function updateRule(updatedRule: Rule): void {
  const rules = selectorList.value;
  const index = rules.findIndex((rule) => rule.id === updatedRule.id);
  if (index === -1) {
    return;
  }

  const updatedRules = [...rules];
  updatedRules[index] = updatedRule;
  selectorList.value = updatedRules;
}
