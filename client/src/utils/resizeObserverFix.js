// Fix para ResizeObserver loop error
// Este erro é benigno mas pode ser suprimido
const resizeObserverLoopErrRe = /^[^(]*ResizeObserver loop/;
const resizeObserverLoopLimitErrRe = /^[^(]*ResizeObserver loop limit exceeded/;

const originalError = console.error;

console.error = (...args) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    (resizeObserverLoopErrRe.test(args[0]) || resizeObserverLoopLimitErrRe.test(args[0]))
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Também suprime no window.onerror
const originalWindowError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (
    typeof message === 'string' &&
    (resizeObserverLoopErrRe.test(message) || resizeObserverLoopLimitErrRe.test(message))
  ) {
    return true; // Suprime o erro
  }
  if (originalWindowError) {
    return originalWindowError(message, source, lineno, colno, error);
  }
  return false;
};
