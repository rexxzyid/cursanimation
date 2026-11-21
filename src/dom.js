export function createElement(tag, className, parent) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (parent) parent.appendChild(element);
  return element;
}

export function closestMatch(target, selector) {
  if (!target || typeof target.closest !== "function") return null;
  return target.closest(selector);
}
