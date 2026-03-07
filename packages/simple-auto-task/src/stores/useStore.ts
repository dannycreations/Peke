import { batch, signal } from '@preact/signals';

import { HighlightState as HighlightStateConst, StatusState as StatusStateConst } from '../app/constants';

import type { ActionType, HighlightState, Rule, RuleOptions, StatusState } from '../app/types';

export const editingRuleId = signal<number | null>(null);
export const highlightState = signal<HighlightState>(HighlightStateConst.IDLE);
export const highlightedRuleIndex = signal<number | null>(null);
export const isAutoRun = signal<boolean>(false);
export const isPicking = signal<boolean>(false);
export const isRunning = signal<boolean>(false);
export const lastHoveredElement = signal<Element | null>(null);
export const selectorList = signal<ReadonlyArray<Rule>>([]);
export const status = signal<StatusState>(StatusStateConst.IDLE);

interface AddRulePayload {
  readonly action: ActionType;
  readonly options: Readonly<Pick<RuleOptions, 'ignoreWait'>>;
  readonly selector: string;
}

let counter = 0;

export const useStore = {
  addRule: (newRuleData: AddRulePayload) => {
    selectorList.value = selectorList.value.concat({ ...newRuleData, id: ++counter });
  },

  removeRule: (idToRemove: number) => {
    selectorList.value = selectorList.value.filter((rule) => rule.id !== idToRemove);
  },

  setEditingRuleId: (id: number | null) => {
    editingRuleId.value = id;
  },

  setHighlightState: (state: HighlightState) => {
    highlightState.value = state;
  },

  setHighlightedRuleIndex: (index: number | null) => {
    highlightedRuleIndex.value = index;
  },

  setIsAutoRun: (value: boolean) => {
    isAutoRun.value = value;
  },

  setIsPicking: (value: boolean) => {
    isPicking.value = value;
  },

  setIsRunning: (value: boolean) => {
    isRunning.value = value;
  },

  setLastHoveredElement: (element: Element | null) => {
    lastHoveredElement.value = element;
  },

  setSelectorList: (list: ReadonlyArray<Rule>) => {
    selectorList.value = list;
  },

  setStatus: (value: StatusState) => {
    status.value = value;
  },

  updateRule: (updatedRule: Rule) => {
    const list = selectorList.value;
    const index = list.findIndex((r) => r.id === updatedRule.id);
    if (index !== -1) {
      const newList = [...list];
      newList[index] = updatedRule;
      selectorList.value = newList;
    }
  },

  batchUpdate: (updates: () => void) => {
    batch(updates);
  },
} as const;
