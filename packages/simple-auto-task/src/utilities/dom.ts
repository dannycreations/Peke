export function generateSelector(el: Element): string {
  const path: string[] = [];
  let current: Element | null = el;

  while (current instanceof Element) {
    const tagName = current.tagName.toLowerCase();

    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const parent: HTMLElement | null = current.parentElement;
    if (!parent) {
      path.unshift(tagName);
      break;
    }

    let nth = 0;
    let count = 0;
    const children = parent.children;
    const len = children.length;
    for (let i = 0; i < len; i++) {
      const sibling = children[i];
      if (sibling.tagName.toLowerCase() === tagName) {
        count++;
        if (sibling === current) {
          nth = count;
        }
        if (nth > 0 && count > 1) break;
      }
    }

    path.unshift(count > 1 ? `${tagName}:nth-of-type(${nth})` : tagName);
    current = parent;
  }

  return path.join(' > ');
}
