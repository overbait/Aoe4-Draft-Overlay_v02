const toggleButton = document.getElementById('toggle-overlay-inputs');
const searchToggle = document.getElementById('search-toggle');
const hostInput = document.getElementById('host-input');
const guestInput = document.getElementById('guest-input');
const hostScoreInput = document.getElementById('host-score-input');
const guestScoreInput = document.getElementById('guest-score-input');
const roomList = document.getElementById('room-list');

let isIgnoringMouse = true;
let isSearching = false;

const pushState = () => {
  if (!window.draftState?.update) return;
  window.draftState.update({
    hostName: hostInput?.value || '',
    guestName: guestInput?.value || '',
    hostScore: Number(hostScoreInput?.value || 0),
    guestScore: Number(guestScoreInput?.value || 0),
  });
};

toggleButton?.addEventListener('click', () => {
  isIgnoringMouse = !isIgnoringMouse;
  window.overlayControls?.setIgnoreMouseEvents?.(isIgnoringMouse);
  toggleButton.textContent = isIgnoringMouse
    ? 'Включить клики по оверлею'
    : 'Отключить клики по оверлею';
});

searchToggle?.addEventListener('click', () => {
  isSearching = !isSearching;
  searchToggle.textContent = isSearching ? 'Поиск игр: ON' : 'Поиск игр: OFF';
  searchToggle.classList.toggle('active', isSearching);
});

hostInput?.addEventListener('input', pushState);
guestInput?.addEventListener('input', pushState);
hostScoreInput?.addEventListener('input', pushState);
guestScoreInput?.addEventListener('input', pushState);

roomList?.addEventListener('click', (event) => {
  const target = event.target.closest('.room-item');
  if (!target) return;
  const host = target.dataset.host || '';
  const guest = target.dataset.guest || '';
  if (hostInput && guestInput) {
    hostInput.value = host;
    guestInput.value = guest;
    pushState();
  }
});

window.draftState?.onChange?.((state) => {
  if (!state) return;
  if (hostInput && hostInput.value !== state.hostName) hostInput.value = state.hostName;
  if (guestInput && guestInput.value !== state.guestName) guestInput.value = state.guestName;
  if (hostScoreInput && hostScoreInput.value !== String(state.hostScore)) hostScoreInput.value = String(state.hostScore);
  if (guestScoreInput && guestScoreInput.value !== String(state.guestScore)) guestScoreInput.value = String(state.guestScore);
});
