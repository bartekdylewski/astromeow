'use strict';
document.addEventListener('wheel', event => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && ['+', '=', '-', '0'].includes(event.key)) {
    event.preventDefault();
  }
});
for (const name of ['gesturestart', 'gesturechange']) {
  document.addEventListener(name, event => event.preventDefault(), { passive: false });
}
