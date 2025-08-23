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
