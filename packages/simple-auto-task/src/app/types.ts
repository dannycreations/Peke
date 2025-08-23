export type ActionType = 'CLICK' | 'DELETE';

export interface Config {
  readonly visible: boolean;
  readonly cycleDelay: number;
  readonly position: Position;
  readonly selectors: ReadonlyArray<Rule>;
  readonly stepDelay: number;
  readonly waitDelay: number;
}

export type DeleteActionType = 'self' | 'parent' | 'custom';

export type HighlightState = 'waiting' | 'success' | 'idle';

export type StatusState = 'idle' | 'running' | 'stopped' | 'waiting';

export interface Position {
  readonly left: number | null;
  readonly right: number | null;
  readonly top: number;
}

export interface Rule {
  readonly action: ActionType;
  readonly id: number;
  readonly options: RuleOptions;
  readonly selector: string;
}

export interface RuleOptions {
  readonly customDeleteSelector?: string;
  readonly deleteActionType?: DeleteActionType;
  readonly ignoreWait: boolean;
  readonly parentSelector?: string;
}
