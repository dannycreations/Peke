export function generateSelector(el: Element): string {
  const path: string[] = [];
  let currentEl: Element | null = el;

  while (currentEl && currentEl.nodeType === Node.ELEMENT_NODE) {
    let selector: string = currentEl.tagName.toLowerCase();

    if (currentEl.id) {
      selector += `#${CSS.escape(currentEl.id)}`;
      path.unshift(selector);
      break;
    } else {
      let sibling: Element | null = currentEl;
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
    currentEl = currentEl.parentElement;
  }

  return path.join(' > ');
}
