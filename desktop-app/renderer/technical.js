const toggleButton = document.getElementById('toggle-overlay-inputs');
const searchToggle = document.getElementById('search-toggle');
const hostInput = document.getElementById('host-input');
const guestInput = document.getElementById('guest-input');
const hostScoreInput = document.getElementById('host-score-input');
const guestScoreInput = document.getElementById('guest-score-input');
const civPicksInput = document.getElementById('civ-picks-input');
const mapPoolInput = document.getElementById('map-pool-input');
const roomList = document.getElementById('room-list');
const pairList = document.getElementById('pair-list');
const roomIdInput = document.getElementById('room-id-input');
const roomHostInput = document.getElementById('room-host-input');
const roomGuestInput = document.getElementById('room-guest-input');
const roomTypeInput = document.getElementById('room-type-input');
const roomStatusInput = document.getElementById('room-status-input');
const roomAddButton = document.getElementById('room-add-button');
const roomStatusLabel = document.getElementById('room-status');

let isIgnoringMouse = true;
let isSearching = false;
const rooms = [];

const normalizeName = (value) => value.trim().toLowerCase();

const setRoomStatus = (message, status) => {
  if (!roomStatusLabel) return;
  roomStatusLabel.textContent = message;
  roomStatusLabel.classList.remove('error', 'success');
  if (status) {
    roomStatusLabel.classList.add(status);
  }
};

const extractDraftId = (value) => {
  if (!value) return null;
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const url = new URL(value);
      const match = url.pathname.match(/\/draft\/([a-zA-Z0-9]+)/);
      if (match && match[1]) return match[1];
      const observerMatch = url.pathname.match(/\/observer\/([a-zA-Z0-9]+)/);
      if (observerMatch && observerMatch[1]) return observerMatch[1];
      const segments = url.pathname.split('/').filter(Boolean);
      const potentialId = segments[segments.length - 1];
      if (potentialId && /^[a-zA-Z0-9_-]+$/.test(potentialId)) return potentialId;
      const draftIdParam = url.searchParams.get('draftId') || url.searchParams.get('id');
      if (draftIdParam) return draftIdParam;
    }
    if (/^[a-zA-Z0-9_-]+$/.test(value)) return value;
  } catch (error) {
    if (/^[a-zA-Z0-9_-]+$/.test(value)) return value;
  }
  return null;
};

const inferDraftType = (draftOptions = []) => {
  if (!Array.isArray(draftOptions) || draftOptions.length === 0) return 'civ';
  const civCount = draftOptions.filter((opt) => opt.id && opt.id.startsWith('aoe4.')).length;
  return civCount >= draftOptions.length / 2 ? 'civ' : 'map';
};

const parsePicksFromEvents = (rawData, type) => {
  if (!rawData || !Array.isArray(rawData.events)) return [];
  const picks = [];
  rawData.events.forEach((event) => {
    if (!event || event.actionType !== 'pick') return;
    const optionId = event.chosenOptionId;
    if (!optionId || typeof optionId !== 'string') return;
    const isCiv = optionId.startsWith('aoe4.');
    if (type === 'civ' && !isCiv) return;
    if (type === 'map' && isCiv) return;
    const option = rawData.preset?.draftOptions?.find((opt) => opt.id === optionId);
    const name = option?.name ? option.name.split('.').pop() : optionId.split('.').pop();
    if (name && !picks.includes(name)) picks.push(name);
  });
  return picks;
};

const renderRooms = () => {
  if (!roomList) return;
  roomList.innerHTML = '';
  rooms.forEach((room) => {
    const row = document.createElement('div');
    row.className = 'room-item';
    row.dataset.host = room.host;
    row.dataset.guest = room.guest;
    row.dataset.type = room.type;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = room.selected;
    checkbox.addEventListener('change', () => {
      room.selected = checkbox.checked;
      renderPairs();
    });

    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${room.host} vs ${room.guest}`;
    const subtitle = document.createElement('p');
    subtitle.textContent = `Room #${room.id} • ${room.type === 'civ' ? 'Civ Draft' : 'Map Draft'} • ${room.status === 'live' ? 'Live' : 'Completed'}`;
    info.appendChild(title);
    info.appendChild(subtitle);

    const chip = document.createElement('span');
    chip.className = room.status === 'live' ? 'chip live' : 'chip';
    chip.textContent = room.status === 'live' ? 'LIVE' : 'DONE';

    row.appendChild(checkbox);
    row.appendChild(info);
    row.appendChild(chip);
    roomList.appendChild(row);
  });
};

const renderPairs = () => {
  if (!pairList) return;
  const pairs = new Map();
  rooms.forEach((room) => {
    const key = [normalizeName(room.host), normalizeName(room.guest)].sort().join('|');
    if (!pairs.has(key)) {
      pairs.set(key, { host: room.host, guest: room.guest, civ: null, map: null });
    }
    const pair = pairs.get(key);
    if (room.type === 'civ') pair.civ = room;
    if (room.type === 'map') pair.map = room;
  });

  pairList.innerHTML = '';
  if (pairs.size === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Пары появятся после добавления комнат.';
    pairList.appendChild(empty);
    return;
  }

  pairs.forEach((pair) => {
    const card = document.createElement('div');
    card.className = 'pair-card';

    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${pair.host} vs ${pair.guest}`;
    const subtitle = document.createElement('p');
    subtitle.textContent = `Civ: ${pair.civ ? `#${pair.civ.id}` : '—'} • Map: ${pair.map ? `#${pair.map.id}` : '—'}`;
    details.appendChild(title);
    details.appendChild(subtitle);

    const action = document.createElement('button');
    if (pair.civ && pair.map) {
      action.className = 'secondary-button';
      action.textContent = 'Открыть в сессию';
      action.addEventListener('click', () => {
        if (hostInput && guestInput) {
          hostInput.value = pair.host;
          guestInput.value = pair.guest;
        }
        pushState();
      });
    } else {
      action.className = 'ghost-button';
      action.textContent = 'Ожидание второй комнаты';
      action.disabled = true;
    }

    card.appendChild(details);
    card.appendChild(action);
    pairList.appendChild(card);
  });
};

const pushState = () => {
  if (!window.draftState?.update) return;
  const civPicks = civPicksInput?.value
    ? civPicksInput.value.split(',').map((item) => item.trim()).filter(Boolean)
    : [];
  const mapPool = mapPoolInput?.value
    ? mapPoolInput.value.split(',').map((item) => item.trim()).filter(Boolean)
    : [];
  window.draftState.update({
    hostName: hostInput?.value || '',
    guestName: guestInput?.value || '',
    hostScore: Number(hostScoreInput?.value || 0),
    guestScore: Number(guestScoreInput?.value || 0),
    civPicks,
    mapPool,
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
civPicksInput?.addEventListener('input', pushState);
mapPoolInput?.addEventListener('input', pushState);

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

roomAddButton?.addEventListener('click', async () => {
  if (!roomIdInput || !roomHostInput || !roomGuestInput || !roomTypeInput || !roomStatusInput) return;
  const rawValue = roomIdInput.value.trim();
  const draftId = extractDraftId(rawValue);
  if (!draftId) {
    setRoomStatus('Неверный ID/URL', 'error');
    return;
  }

  setRoomStatus('Импорт...', '');
  let host = roomHostInput.value.trim();
  let guest = roomGuestInput.value.trim();
  let type = roomTypeInput.value;
  let status = roomStatusInput.value;

  if (!host || !guest) {
    const response = await window.draftState?.fetchDraft?.(draftId);
    if (response?.ok && response.data) {
      host = response.data.nameHost || host;
      guest = response.data.nameGuest || guest;
      type = inferDraftType(response.data.preset?.draftOptions || []);
      status = response.data.ongoing === false ? 'done' : status;
      if (type === 'civ') {
        const picks = parsePicksFromEvents(response.data, 'civ');
        if (civPicksInput && picks.length) {
          civPicksInput.value = picks.join(', ');
        }
      }
      if (type === 'map') {
        const picks = parsePicksFromEvents(response.data, 'map');
        if (mapPoolInput && picks.length) {
          mapPoolInput.value = picks.join(', ');
        }
      }
      pushState();
      setRoomStatus('Импортировано', 'success');
    } else if (!host || !guest) {
      setRoomStatus(response?.error || 'Не удалось получить данные', 'error');
      return;
    } else {
      setRoomStatus('Добавлено вручную', 'success');
    }
  } else {
    setRoomStatus('Добавлено вручную', 'success');
  }

  if (!host || !guest) {
    setRoomStatus('Host/Guest обязательны', 'error');
    return;
  }

  rooms.unshift({
    id: draftId,
    host,
    guest,
    type,
    status,
    selected: false,
  });
  roomIdInput.value = '';
  renderRooms();
  renderPairs();
});

window.draftState?.onChange?.((state) => {
  if (!state) return;
  if (hostInput && hostInput.value !== state.hostName) hostInput.value = state.hostName;
  if (guestInput && guestInput.value !== state.guestName) guestInput.value = state.guestName;
  if (hostScoreInput && hostScoreInput.value !== String(state.hostScore)) hostScoreInput.value = String(state.hostScore);
  if (guestScoreInput && guestScoreInput.value !== String(state.guestScore)) guestScoreInput.value = String(state.guestScore);
  if (civPicksInput) civPicksInput.value = (state.civPicks || []).join(', ');
  if (mapPoolInput) mapPoolInput.value = (state.mapPool || []).join(', ');
});

renderRooms();
renderPairs();
