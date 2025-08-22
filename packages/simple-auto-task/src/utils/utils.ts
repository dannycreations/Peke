import { ActionType } from '../app/constants';

import type { Rule } from '../app/types';

export function generateSelector(el: Element): string {
  const path: string[] = [];
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector: string = el.tagName.toLowerCase();
    if (el.id) {
      selector += `#${CSS.escape(el.id)}`;
      path.unshift(selector);
      break;
    } else {
      let sibling: Element | null = el;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling) !== null) {
        if (sibling.tagName.toLowerCase() === selector) {
          nth++;
        }
      }
      if (nth !== 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }
    path.unshift(selector);
    el = el.parentElement!;
  }
  return path.join(' > ');
}

export function migrateConfig(selectors: ReadonlyArray<unknown>): ReadonlyArray<Rule> {
  return selectors.map((item: unknown, index: number): Rule => {
    if (typeof item === 'string') {
      return {
        action: ActionType.CLICK,
        id: Date.now() + index,
        options: {
          ignoreWait: false,
        },
        selector: item,
      };
    }

    if (typeof item === 'object' && item !== null) {
      const potentialRule = item as Partial<Rule>;
      const id: number = typeof potentialRule.id === 'number' ? potentialRule.id : Date.now() + index;

      const newRule: Rule = {
        action: potentialRule.action ?? ActionType.CLICK,
        id,
        options: {
          ignoreWait: false,
          ...(potentialRule.options ?? {}),
        },
        selector: potentialRule.selector ?? '',
      };
      return newRule;
    }

    return {
      action: ActionType.CLICK,
      id: Date.now() + index,
      options: {
        ignoreWait: false,
      },
      selector: '',
    };
  });
}
