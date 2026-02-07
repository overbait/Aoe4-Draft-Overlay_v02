const toggleButton = document.getElementById('toggle-overlay-inputs');
let isIgnoringMouse = true;

toggleButton?.addEventListener('click', () => {
  isIgnoringMouse = !isIgnoringMouse;
  if (window.overlayControls?.setIgnoreMouseEvents) {
    window.overlayControls.setIgnoreMouseEvents(isIgnoringMouse);
  }
  toggleButton.textContent = isIgnoringMouse
    ? 'Включить клики по оверлею'
    : 'Отключить клики по оверлею';
});
