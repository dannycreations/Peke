import type { ActionType } from './constants';

export type DeleteActionType = 'self' | 'parent' | 'custom';

export type DelayKey = 'cycleDelay' | 'stepDelay' | 'waitDelay';

export interface Config {
  readonly visible: boolean;
  readonly cycleDelay: number;
  readonly position: Position;
  readonly selectors: ReadonlyArray<Rule>;
  readonly stepDelay: number;
  readonly waitDelay: number;
}

export interface Position {
  readonly left: number | null;
  readonly right: number | null;
  readonly top: number;
}

export interface Rule {
  readonly id: number;
  readonly action: ActionType;
  readonly selector: string;
  readonly options: RuleOptions;
}

export interface RuleOptions {
  readonly ignoreWait: boolean;
  readonly deleteActionType?: DeleteActionType;
  readonly parentSelector?: string;
  readonly customSelector?: string;
}
