const hostEl = document.getElementById('overlay-host');
const guestEl = document.getElementById('overlay-guest');
const scoreEl = document.getElementById('overlay-score');
const civList = document.getElementById('overlay-civ-picks');
const mapList = document.getElementById('overlay-map-pool');

const renderList = (container, items) => {
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    container.appendChild(li);
  });
};

const renderState = (state) => {
  if (!state) return;
  if (hostEl) hostEl.textContent = state.hostName || 'Host';
  if (guestEl) guestEl.textContent = state.guestName || 'Guest';
  if (scoreEl) scoreEl.textContent = `${state.hostScore ?? 0} : ${state.guestScore ?? 0}`;
  renderList(civList, state.civPicks || []);
  renderList(mapList, state.mapPool || []);
};

window.draftState?.onChange?.(renderState);
