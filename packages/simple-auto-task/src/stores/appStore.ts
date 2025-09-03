import { create } from 'zustand';

import { HighlightState as HighlightStateConst, StatusState as StatusStateConst } from '../app/constants';

import type { ActionType, HighlightState, Rule, RuleOptions, StatusState } from '../app/types';

interface AppState {
  readonly editingRuleId: number | null;
  readonly highlightState: HighlightState;
  readonly highlightedRuleIndex: number | null;
  readonly isAutoRun: boolean;
  readonly isPicking: boolean;
  readonly isRunning: boolean;
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
  readonly setIsAutoRun: (isAutoRun: boolean) => void;
  readonly setIsPicking: (isPicking: boolean) => void;
  readonly setIsRunning: (isRunning: boolean) => void;
  readonly setLastHoveredElement: (element: Element | null) => void;
  readonly setSelectorList: (selectorList: ReadonlyArray<Rule>) => void;
  readonly setStatus: (status: StatusState) => void;
  readonly updateRule: (updatedRule: Rule) => void;
}

const initialState: AppState = {
  editingRuleId: null,
  highlightState: HighlightStateConst.IDLE,
  highlightedRuleIndex: null,
  isAutoRun: false,
  isPicking: false,
  isRunning: false,
  lastHoveredElement: null,
  selectorList: [],
  status: StatusStateConst.IDLE,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  ...initialState,

  addRule: (newRuleData) => {
    set((state) => ({
      selectorList: [...state.selectorList, { ...newRuleData, id: Date.now() }],
    }));
  },

  removeRule: (idToRemove) => {
    set((state) => ({
      selectorList: state.selectorList.filter((rule) => rule.id !== idToRemove),
    }));
  },

  setEditingRuleId: (id) => {
    set({ editingRuleId: id });
  },

  setHighlightState: (state) => {
    set({ highlightState: state });
  },

  setHighlightedRuleIndex: (index) => {
    set({ highlightedRuleIndex: index });
  },

  setIsAutoRun: (isAutoRun) => {
    set({ isAutoRun });
  },

  setIsPicking: (isPicking) => {
    set({ isPicking });
  },

  setIsRunning: (isRunning) => {
    set({ isRunning });
  },

  setLastHoveredElement: (element) => {
    set({ lastHoveredElement: element });
  },

  setSelectorList: (selectorList) => {
    set({ selectorList });
  },

  setStatus: (status) => {
    set({ status });
  },

  updateRule: (updatedRule) => {
    set((state) => ({
      selectorList: state.selectorList.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule)),
    }));
  },
}));
