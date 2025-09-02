import { create } from 'zustand';

import { HighlightState as HighlightStateConst, StatusState as StatusStateConst } from '../app/constants';

import type { ActionType, HighlightState, Rule, RuleOptions, StatusState } from '../app/types';

interface AppState {
  readonly editingRuleId: number | null;
  readonly highlightState: HighlightState;
  readonly highlightedRuleIndex: number | null;
  readonly isPicking: boolean;
  readonly isRunning: boolean;
  readonly isAutoRun: boolean;
  readonly lastHoveredElement: Element | null;
  readonly selectorList: ReadonlyArray<Rule>;
  readonly status: StatusState;
}

type AddRulePayload = {
  readonly action: ActionType;
  readonly options: Readonly<Pick<RuleOptions, 'ignoreWait'>>;
  readonly selector: string;
};

interface AppActions {
  readonly addRule: (newRuleData: AddRulePayload) => void;
  readonly removeRule: (id: number) => void;
  readonly setEditingRuleId: (id: number | null) => void;
  readonly setHighlightState: (state: HighlightState) => void;
  readonly setHighlightedRuleIndex: (index: number | null) => void;
  readonly setIsPicking: (isPicking: boolean) => void;
  readonly setIsRunning: (isRunning: boolean) => void;
  readonly setIsAutoRun: (isAutoRun: boolean) => void;
  readonly setLastHoveredElement: (element: Element | null) => void;
  readonly setSelectorList: (selectorList: ReadonlyArray<Rule>) => void;
  readonly setStatus: (status: StatusState) => void;
  readonly updateRule: (updatedRule: Rule) => void;
}

const initialState: AppState = {
  editingRuleId: null,
  highlightState: HighlightStateConst.IDLE,
  highlightedRuleIndex: null,
  isPicking: false,
  isRunning: false,
  isAutoRun: false,
  lastHoveredElement: null,
  selectorList: [],
  status: StatusStateConst.IDLE,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  ...initialState,

  addRule: (newRuleData: AddRulePayload) => {
    set((state: AppState) => ({
      selectorList: [...state.selectorList, { ...newRuleData, id: Date.now() }],
    }));
  },

  removeRule: (idToRemove: number) => {
    set((state: AppState) => ({
      selectorList: state.selectorList.filter((rule) => rule.id !== idToRemove),
    }));
  },

  setEditingRuleId: (id: number | null) => {
    set({ editingRuleId: id });
  },

  setHighlightState: (state: HighlightState) => {
    set({ highlightState: state });
  },

  setHighlightedRuleIndex: (index: number | null) => {
    set({ highlightedRuleIndex: index });
  },

  setIsPicking: (isPicking: boolean) => {
    set({ isPicking });
  },

  setIsRunning: (isRunning: boolean) => {
    set({ isRunning });
  },

  setIsAutoRun: (isAutoRun: boolean) => {
    set({ isAutoRun });
  },

  setLastHoveredElement: (element: Element | null) => {
    set({ lastHoveredElement: element });
  },

  setSelectorList: (selectorList: ReadonlyArray<Rule>) => {
    set({ selectorList });
  },

  setStatus: (status: StatusState) => {
    set({ status });
  },

  updateRule: (updatedRule: Rule) => {
    set((state: AppState) => ({
      selectorList: state.selectorList.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule)),
    }));
  },
}));
