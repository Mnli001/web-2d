// ШУТИС МХТС 2D Ухаалаг Кампус: Үндсэн Хөдөлгүүр & Бүх 6 Модулийн Нэгдэл

import { io } from 'socket.io-client';
import {
  buildWallsForFloor,
  ROOMS_F1, ROOMS_F2, ALL_ROOMS,
  STAIRS_F1, STAIRS_F2,
  SPAWN_POINT_F1, SPAWN_POINT_F2,
  INTERACTIVE_OBJECTS,
  SCALE
} from './schoolData.js';
import { Renderer2D } from './renderer2d.js';
import { Character } from './character.js';
import { sound } from './audio.js';
import { questManager, QUEST_STEPS } from './quest.js';

// ==========================================
// 1. СИСТЕМИЙН ЭХЛЭЛ & ХАДГАЛАГДСАН ХЭРЭГЛЭГЧ
// ==========================================
let currentUser = JSON.parse(localStorage.getItem('sict_current_user') || 'null');
if (!currentUser) {
  currentUser = {
    studentCode: 'B210910001',
    name: 'Тэмүүлэн',
    role: 'student',
    status: 'campus',
    color: '#2563eb',
    hairColor: '#2c1e1a'
  };
}

let currentFloor = Number(localStorage.getItem('sict_current_floor') || 1);
let wallsData = buildWallsForFloor(currentFloor);

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer2D(canvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Орон нутгийн тоглогч
const spawn = currentFloor === 2 ? SPAWN_POINT_F2 : SPAWN_POINT_F1;
const localPlayer = new Character({
  id: 'me',
  studentCode: currentUser.studentCode,
  name: currentUser.name,
  role: currentUser.role,
  status: currentUser.status,
  floor: currentFloor,
  x: spawn.x,
  y: spawn.y,
  color: currentUser.color || '#2563eb',
  hairColor: currentUser.hairColor || '#2c1e1a',
  isLocal: true
});

// Өмнө гарахдаа байсан байршлыг сэргээх (ижил давхар дээр бол)
const savedPos = JSON.parse(localStorage.getItem('sict_position') || 'null');
if (savedPos && savedPos.floor === currentFloor) {
  localPlayer.x = savedPos.x;
  localPlayer.y = savedPos.y;
}

// Хуудас хаах эсвэл гарахад байршлыг хадгална
window.addEventListener('beforeunload', () => {
  localStorage.setItem('sict_position', JSON.stringify({
    floor: currentFloor,
    x: localPlayer.x,
    y: localPlayer.y
  }));
  // Серверээс шууд салгана, эс бөгөөс хуучин дүрс тоглоомд үлддэг
  if (socket) socket.disconnect();
});

const otherPlayers = {};
const camera = { x: localPlayer.x, y: localPlayer.y };

// ==========================================
// 2. ДАВХАР СОЛИХ СИСТЕМ (FLOOR SWITCHER)
// ==========================================
function switchFloor(newFloor) {
  if (currentFloor === newFloor) return;
  currentFloor = newFloor;
  localStorage.setItem('sict_current_floor', currentFloor);
  localPlayer.floor = currentFloor;

  const targetSpawn = currentFloor === 2 ? SPAWN_POINT_F2 : SPAWN_POINT_F1;
  localPlayer.x = targetSpawn.x;
  localPlayer.y = targetSpawn.y;
  camera.x = localPlayer.x;
  camera.y = localPlayer.y;

  wallsData = buildWallsForFloor(currentFloor);
  sound.playClick();

  // Товчлууруудын харагдах байдал
  document.querySelectorAll('.floor-btn').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.floor) === currentFloor);
  });

  if (socket && socket.connected) {
    socket.emit('floor:change', currentFloor);
  }
}

document.querySelectorAll('.floor-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchFloor(Number(btn.dataset.floor));
  });
});

// ==========================================
// 3. МӨРГӨЛДӨӨН ШАЛГАХ (COLLISION DETECTION)
// ==========================================
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return Math.hypot(px - projX, py - projY);
}

const COLLISION_RADIUS = 14;

function checkCollision(x, y) {
  if (x < 125 * SCALE || x > 1095 * SCALE || y < 15 * SCALE || y > 920 * SCALE) return true;
  for (const seg of wallsData.segments) {
    if (distToSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2) < COLLISION_RADIUS) {
      return true;
    }
  }
  return false;
}

// ==========================================
// 4. ОДООГИЙН ӨРӨӨ & ОЙРХОН ОБЪЕКТУУД
// ==========================================
let currentRoom = null;
let nearbyInteractive = null;

function updateLocation(px, py) {
  const rooms = currentFloor === 2 ? ROOMS_F2 : ROOMS_F1;
  let found = null;

  for (const r of rooms) {
    if (px >= r.bounds.x1 && px <= r.bounds.x2 && py >= r.bounds.y1 && py <= r.bounds.y2) {
      found = r;
      break;
    }
  }

  currentRoom = found;

  // Интерактив объекттой ойрхон эсэх
  const objs = INTERACTIVE_OBJECTS.filter(o => o.floor === currentFloor);
  nearbyInteractive = objs.find(o => Math.hypot(px - o.x, py - o.y) < 38) || null;

  // Квест шалгах
  questManager.checkLocation(currentRoom?.id || '', localPlayer.hasCoffee);

  // Шаттай ойрхон бол автоматаар сануулах
  const stairs = currentFloor === 2 ? STAIRS_F2 : STAIRS_F1;
  const nearStair = stairs.find(st => px >= st.x1 && px <= st.x2 && py >= st.y1 && py <= st.y2);
  if (nearStair) {
    // Шат руу очвол давхар солих
    switchFloor(nearStair.targetFloor);
  }
}

// ==========================================
// 5. УДИРДЛАГА (KEYBOARD & MOUSE)
// ==========================================
const keys = {};
let isTyping = false;

window.addEventListener('keydown', (e) => {
  if (isTyping) {
    if (e.key === 'Escape') {
      document.querySelectorAll('input').forEach(i => i.blur());
      isTyping = false;
    }
    return;
  }

  keys[e.code] = true;

  // E товч: Интерактив үйлдэл эсвэл Өрөөний мэдээлэл нээх
  if (e.code === 'KeyE') {
    if (nearbyInteractive) {
      handleInteractiveAction(nearbyInteractive);
    } else if (currentRoom) {
      openRoomModal(currentRoom);
    }
  }

  // Enter: Чат руу орох
  if (e.code === 'Enter') {
    const chatInput = document.getElementById('chat-input');
    chatInput.focus();
    isTyping = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (isTyping) return;
  keys[e.code] = false;
});

function handleInteractiveAction(obj) {
  sound.playClick();
  if (obj.action === 'drink_coffee') {
    localPlayer.hasCoffee = true;
    sound.playCoffeeBrew();
    localPlayer.say('Халуун кофе уулаа! ☕');
    if (socket && socket.connected) {
      socket.emit('interactive:action', { hasCoffee: true });
    }
    questManager.checkLocation('canteen_main', true);
  } else if (obj.action === 'sit') {
    localPlayer.isSitting = !localPlayer.isSitting;
    if (localPlayer.isSitting) {
      localPlayer.say('Тухлан суулаа 🪑');
    }
    if (socket && socket.connected) {
      socket.emit('interactive:action', { isSitting: localPlayer.isSitting });
    }
  }
}

// Хулганаар өрөө дээр дарж мэдээлэл нээх
canvas.addEventListener('click', (e) => {
  if (isTyping) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Дэлгэцийн координатыг Дэлхийн координат руу хөрвүүлэх
  const worldX = (mouseX - canvas.width / 2) / renderer.zoom + camera.x;
  const worldY = (mouseY - canvas.height / 2) / renderer.zoom + camera.y;

  const rooms = currentFloor === 2 ? ROOMS_F2 : ROOMS_F1;
  const clickedRoom = rooms.find(r =>
    worldX >= r.bounds.x1 && worldX <= r.bounds.x2 &&
    worldY >= r.bounds.y1 && worldY <= r.bounds.y2
  );

  if (clickedRoom) {
    sound.playClick();
    openRoomModal(clickedRoom);
  }
});

// Zoom товчнууд
document.getElementById('btn-zoom-in').addEventListener('click', () => {
  renderer.zoom = Math.min(renderer.maxZoom, renderer.zoom + 0.25);
  sound.playClick();
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  renderer.zoom = Math.max(renderer.minZoom, renderer.zoom - 0.25);
  sound.playClick();
});
document.getElementById('btn-zoom-reset').addEventListener('click', () => {
  renderer.zoom = 1.0;
  camera.x = localPlayer.x;
  camera.y = localPlayer.y;
  sound.playClick();
});
document.getElementById('btn-poi-toggle').addEventListener('click', () => {
  renderer.showPOIs = !renderer.showPOIs;
  sound.playClick();
});

// Дуу хаах/нээх
const soundBtn = document.getElementById('btn-sound-toggle');
soundBtn.textContent = sound.isMuted ? '🔇' : '🔊';
soundBtn.addEventListener('click', () => {
  const muted = sound.toggleMute();
  soundBtn.textContent = muted ? '🔇' : '🔊';
});

// ==========================================
// 6. ХАЙЛТЫН СИСТЕМ (ROOM & FACILITY SEARCH)
// ==========================================
const searchInput = document.getElementById('room-search-input');
const searchDropdown = document.getElementById('search-dropdown');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchDropdown.style.display = 'none';
    return;
  }

  const matches = ALL_ROOMS.filter(r =>
    r.name.toLowerCase().includes(query) ||
    r.id.toLowerCase().includes(query) ||
    (r.info && r.info.toLowerCase().includes(query))
  );

  searchDropdown.innerHTML = '';
  if (matches.length === 0) {
    searchDropdown.innerHTML = `<div style="padding:10px; font-size:12px; color:#94a3b8; text-align:center;">Өрөө олдсонгүй</div>`;
  } else {
    for (const r of matches) {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <div>
          <div class="search-item-title">${r.name}</div>
          <div class="search-item-sub">${r.floor}-р давхар | ${r.capacity || 30} суудал</div>
        </div>
        <span style="font-size:11px; color:#38bdf8; font-weight:700;">Очих ➜</span>
      `;
      item.addEventListener('click', () => {
        navigateToRoom(r);
        searchDropdown.style.display = 'none';
        searchInput.value = '';
      });
      searchDropdown.appendChild(item);
    }
  }
  searchDropdown.style.display = 'flex';
});

function navigateToRoom(room) {
  if (currentFloor !== room.floor) {
    switchFloor(room.floor);
  }
  const cx = (room.bounds.x1 + room.bounds.x2) / 2;
  const cy = (room.bounds.y1 + room.bounds.y2) / 2;

  // Камер шилжүүлэх ба заагч гэрэл асаах
  camera.x = cx;
  camera.y = cy;
  renderer.setBeacon(cx, cy);
  sound.playClick();
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchDropdown.style.display = 'none';
  }
});

// ==========================================
// 7. ӨРӨӨНИЙ МОДАЛ & СЭТГЭГДЭЛ (ROOM MODAL)
// ==========================================
const roomModal = document.getElementById('room-detail-modal');
const roomTitle = document.getElementById('room-modal-title');
const roomSubtitle = document.getElementById('room-modal-subtitle');
const roomDesc = document.getElementById('room-modal-desc');
const scheduleBody = document.getElementById('room-schedule-body');
const reviewsList = document.getElementById('room-reviews-list');
let activeModalRoom = null;
let allReviews = {};

function openRoomModal(room) {
  activeModalRoom = room;
  roomTitle.textContent = room.name;
  roomSubtitle.textContent = `${room.floor}-р давхар | Багтаамж: ${room.capacity || 40} суудал | Хариуцсан: ${room.inCharge || 'МХТС'}`;
  roomDesc.textContent = room.info || 'МХТС-ийн сургалтын танхим.';

  // Хичээлийн хуваарь
  scheduleBody.innerHTML = '';
  if (room.schedule && room.schedule.length > 0) {
    for (const s of room.schedule) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><b>${s.time}</b></td><td>${s.course}</td><td>${s.lecturer}</td>`;
      scheduleBody.appendChild(tr);
    }
  } else {
    scheduleBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Одоогоор тогтсон хуваарьгүй байна</td></tr>`;
  }

  // Сэтгэгдлүүд
  renderRoomReviews(room.id);
  roomModal.style.display = 'flex';
}

function renderRoomReviews(roomId) {
  reviewsList.innerHTML = '';
  const revs = allReviews[roomId] || [];
  if (revs.length === 0) {
    reviewsList.innerHTML = `<div style="font-size:12px; color:#94a3b8; text-align:center; padding:8px;">Сэтгэгдэл бичигдээгүй байна. Анхных нь болоорой!</div>`;
    return;
  }
  for (const r of revs) {
    const stars = '⭐'.repeat(r.rating);
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="review-author">
        <span>${r.author}</span>
        <span>${stars}</span>
      </div>
      <div style="color:#cbd5e1; margin-top:3px;">${r.comment}</div>
      <div style="font-size:10px; color:#64748b; margin-top:2px;">${r.date}</div>
    `;
    reviewsList.appendChild(item);
  }
}

document.getElementById('btn-close-room').addEventListener('click', () => {
  roomModal.style.display = 'none';
});

document.getElementById('btn-submit-review').addEventListener('click', () => {
  if (!activeModalRoom) return;
  const rating = Number(document.getElementById('review-rating').value);
  const comment = document.getElementById('review-comment-input').value.trim();
  if (!comment) return;

  if (socket && socket.connected) {
    socket.emit('room:review:add', {
      roomId: activeModalRoom.id,
      rating,
      comment
    });
  } else {
    if (!allReviews[activeModalRoom.id]) allReviews[activeModalRoom.id] = [];
    allReviews[activeModalRoom.id].unshift({
      author: localPlayer.name,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    });
    renderRoomReviews(activeModalRoom.id);
  }
  document.getElementById('review-comment-input').value = '';
  sound.playClick();
});

// ==========================================
// 8. ЧАТ БА ЭМОЖИ (MULTI-CHANNEL CHAT)
// ==========================================
let activeChatTab = 'global'; // 'global', 'room', 'private'
let privateTargetId = null;

document.querySelectorAll('.chat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeChatTab = tab.dataset.tab;
    sound.playClick();

    if (activeChatTab === 'private') {
      openDmPicker();
    }
  });
});

const chatContainer = document.getElementById('chat-container');
document.getElementById('btn-toggle-chat').addEventListener('click', () => {
  chatContainer.classList.toggle('collapsed');
  sound.playClick();
});

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

function addChatMessage(msg) {
  const line = document.createElement('div');
  line.className = `chat-msg ${msg.type === 'private' ? 'private' : ''}`;

  let prefix = '';
  if (msg.type === 'room') prefix = '[Өрөө] ';
  if (msg.type === 'private') prefix = '[Хувийн] ';

  line.innerHTML = `
    <span class="time">${msg.time || ''}</span>
    <span class="sender ${msg.role || 'student'}">${prefix}${msg.name || msg.fromName || 'Оюутан'}:</span>
    <span>${msg.text}</span>
  `;
  chatMessages.appendChild(line);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  sound.playChatNotification();
}

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  chatInput.blur();
  isTyping = false;

  localPlayer.say(text);

  if (socket && socket.connected) {
    if (activeChatTab === 'room') {
      socket.emit('chat:room', { roomId: currentRoom?.id || 'corridor', text });
    } else if (activeChatTab === 'private' && privateTargetId) {
      socket.emit('chat:private', { targetId: privateTargetId, text });
    } else {
      socket.emit('chat:global', text);
    }
  } else {
    addChatMessage({
      name: localPlayer.name,
      role: localPlayer.role,
      text,
      type: activeChatTab,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }
}

chatSend.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') sendChat();
});
chatInput.addEventListener('focus', () => (isTyping = true));
chatInput.addEventListener('blur', () => (isTyping = false));

// Эможи илгээх
document.querySelectorAll('.emote-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const emote = btn.dataset.emote;
    localPlayer.showEmote(emote);
    sound.playClick();
    if (socket && socket.connected) {
      socket.emit('chat:emote', emote);
    }
  });
});

// DM сонгогч
const dmModal = document.getElementById('dm-picker-modal');
function openDmPicker() {
  const list = document.getElementById('dm-users-list');
  list.innerHTML = '';
  const onlineIds = Object.keys(otherPlayers);

  if (onlineIds.length === 0) {
    list.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:12px;">Одоогоор өөр онлайн оюутан алга байна.</div>`;
  } else {
    for (const id of onlineIds) {
      const p = otherPlayers[id];
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `<div><b>${p.name}</b> <span style="font-size:11px; color:#94a3b8;">(${p.role})</span></div><span style="color:#38bdf8;">Сонгох ➜</span>`;
      item.addEventListener('click', () => {
        privateTargetId = id;
        dmModal.style.display = 'none';
        chatInput.placeholder = `${p.name} руу хувийн мессеж бичих...`;
        chatInput.focus();
        isTyping = true;
      });
      list.appendChild(item);
    }
  }
  dmModal.style.display = 'flex';
}
document.getElementById('btn-close-dm').addEventListener('click', () => dmModal.style.display = 'none');

// ==========================================
// 9. АДМИН ПАНЕЛ & ЗАРЛАЛ (ADMIN DASHBOARD)
// ==========================================
const adminModal = document.getElementById('admin-modal');
document.getElementById('btn-open-admin').addEventListener('click', () => {
  if (localPlayer.role !== 'admin' && localPlayer.role !== 'teacher') {
    alert('Админ эсвэл Багш эрхтэй хэрэглэгч нэвтрэх боломжтой!');
    return;
  }
  sound.playClick();
  renderAdminUsers();
  adminModal.style.display = 'flex';
});

document.getElementById('btn-close-admin').addEventListener('click', () => {
  adminModal.style.display = 'none';
});

function renderAdminUsers() {
  const list = document.getElementById('admin-users-list');
  list.innerHTML = '';
  const countSpan = document.getElementById('admin-online-count');
  const allIds = Object.keys(otherPlayers);
  countSpan.textContent = allIds.length + 1;

  for (const id of allIds) {
    const p = otherPlayers[id];
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:12px;';
    row.innerHTML = `
      <div><b>${p.name}</b> <span style="color:#94a3b8;">(${p.role})</span> - ${p.floor}-р давхарт</div>
      <div style="display:flex; gap:4px;">
        <button class="chip-btn" data-kick="${id}">Бандах 🚫</button>
      </div>
    `;
    row.querySelector(`[data-kick="${id}"]`).addEventListener('click', () => {
      if (socket && socket.connected) {
        socket.emit('admin:kick', id);
        sound.playClick();
      }
    });
    list.appendChild(row);
  }
}

document.getElementById('btn-admin-broadcast-send').addEventListener('click', () => {
  const text = document.getElementById('admin-broadcast-input').value.trim();
  if (!text) return;
  if (socket && socket.connected) {
    socket.emit('admin:broadcast', text);
  }
  document.getElementById('admin-broadcast-input').value = '';
  sound.playClick();
});

// ==========================================
// 10. ПРОФАЙЛ ТОХИРГОО & AUTHENTICATION
// ==========================================
const profileModal = document.getElementById('profile-modal');
const authModal = document.getElementById('auth-modal');

document.getElementById('btn-open-profile').addEventListener('click', () => {
  document.getElementById('prof-name').value = localPlayer.name;
  document.getElementById('prof-status').value = localPlayer.status || 'campus';
  document.getElementById('prof-color').value = localPlayer.color;
  document.getElementById('prof-hair').value = localPlayer.hairColor;
  profileModal.style.display = 'flex';
  sound.playClick();
});

document.getElementById('btn-close-profile').addEventListener('click', () => {
  profileModal.style.display = 'none';
});

document.getElementById('btn-save-profile').addEventListener('click', () => {
  localPlayer.name = document.getElementById('prof-name').value.trim() || localPlayer.name;
  localPlayer.status = document.getElementById('prof-status').value;
  localPlayer.color = document.getElementById('prof-color').value;
  localPlayer.hairColor = document.getElementById('prof-hair').value;

  currentUser.name = localPlayer.name;
  currentUser.status = localPlayer.status;
  currentUser.color = localPlayer.color;
  currentUser.hairColor = localPlayer.hairColor;
  localStorage.setItem('sict_current_user', JSON.stringify(currentUser));

  // profile.html-тэй ижил мэдээлэлтэй байхын тулд хэрэглэгчийн жагсаалтад ч хадгална
  const users = JSON.parse(localStorage.getItem('shutis_users') || '[]');
  const email = localStorage.getItem('current_email') || sessionStorage.getItem('current_email');
  const me = users.find(u => u.email === email);
  if (me) {
    me.name = localPlayer.name;
    me.place = localPlayer.status === 'home' ? 'home' : 'school';
    me.status = localPlayer.status === 'busy' ? 'busy' : 'online';
    localStorage.setItem('shutis_users', JSON.stringify(users));
  }

  updateProfileUI();
  profileModal.style.display = 'none';
  sound.playClick();

  if (socket && socket.connected) {
    socket.emit('profile:update', {
      name: localPlayer.name,
      status: localPlayer.status,
      color: localPlayer.color,
      hairColor: localPlayer.hairColor
    });
  }
});

function updateProfileUI() {
  document.getElementById('profile-display-name').textContent = localPlayer.name;
  const roleTag = document.getElementById('profile-role-tag');
  roleTag.className = `role-tag ${localPlayer.role}`;
  roleTag.textContent = localPlayer.role === 'admin' ? 'Админ' : (localPlayer.role === 'teacher' ? 'Багш' : 'Оюутан');

  const statusDot = document.getElementById('profile-status-dot');
  statusDot.className = `status-dot-sm ${localPlayer.status || 'campus'}`;
}
updateProfileUI();

// Гарах: байршлыг хадгалаад login руу буцна
function logout(e) {
  e.preventDefault();
  if (!confirm('Системээс гарах уу?')) return;
  localStorage.removeItem('current_email');
  sessionStorage.removeItem('current_email');
  window.location.href = '/login.html';
}
document.getElementById('btn-logout').addEventListener('click', logout);
document.getElementById('btn-top-logout').addEventListener('click', logout);

// Auth Modal
document.getElementById('btn-close-auth').addEventListener('click', () => authModal.style.display = 'none');
document.getElementById('tab-login').addEventListener('click', () => {
  document.getElementById('form-login').style.display = 'block';
  document.getElementById('form-register').style.display = 'none';
  document.getElementById('tab-login').style.borderBottom = '2px solid #38bdf8';
  document.getElementById('tab-register').style.borderBottom = 'none';
});
document.getElementById('tab-register').addEventListener('click', () => {
  document.getElementById('form-login').style.display = 'none';
  document.getElementById('form-register').style.display = 'block';
  document.getElementById('tab-register').style.borderBottom = '2px solid #38bdf8';
  document.getElementById('tab-login').style.borderBottom = 'none';
});

document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const studentCode = document.getElementById('login-code').value.trim();
  const password = document.getElementById('login-pass').value;

  if (socket && socket.connected) {
    socket.emit('auth:login', { studentCode, password }, (res) => {
      if (res.success) {
        localPlayer.studentCode = res.user.studentCode;
        localPlayer.name = res.user.name;
        localPlayer.role = res.user.role;
        currentUser = Object.assign(currentUser, res.user);
        localStorage.setItem('sict_current_user', JSON.stringify(currentUser));
        updateProfileUI();
        authModal.style.display = 'none';
        sound.playQuestComplete();
      } else {
        alert(res.message);
      }
    });
  }
});

document.getElementById('form-register').addEventListener('submit', (e) => {
  e.preventDefault();
  const studentCode = document.getElementById('reg-code').value.trim();
  const name = document.getElementById('reg-name').value.trim();
  const role = document.getElementById('reg-role').value;
  const password = document.getElementById('reg-pass').value;

  if (socket && socket.connected) {
    socket.emit('auth:register', { studentCode, name, role, password }, (res) => {
      if (res.success) {
        localPlayer.studentCode = res.user.studentCode;
        localPlayer.name = res.user.name;
        localPlayer.role = res.user.role;
        currentUser = Object.assign(currentUser, res.user);
        localStorage.setItem('sict_current_user', JSON.stringify(currentUser));
        updateProfileUI();
        authModal.style.display = 'none';
        sound.playQuestComplete();
      } else {
        alert(res.message);
      }
    });
  }
});

// ==========================================
// 11. КВЕСТ КАРТ ШИНЭЧЛЭХ (QUEST UI)
// ==========================================
function updateQuestUI() {
  const quest = questManager.getCurrentQuest();
  const title = document.getElementById('quest-step-name');
  const desc = document.getElementById('quest-step-desc');
  const bar = document.getElementById('quest-progress-bar');
  const count = document.getElementById('quest-count');

  if (!quest) {
    title.textContent = '🏆 Бүх Даалгавар Биелсэн!';
    desc.textContent = 'Та сургуулийн аялагч батламжаа гардан авсан байна.';
    bar.style.width = '100%';
    count.textContent = '5/5 Бүрэн';
  } else {
    title.textContent = quest.title;
    desc.textContent = quest.desc;
    const pct = ((questManager.currentStep) / QUEST_STEPS.length) * 100;
    bar.style.width = `${Math.max(15, pct)}%`;
    count.textContent = `${questManager.currentStep + 1}/5 Даалгавар`;
  }
}
questManager.onUpdate(updateQuestUI);
updateQuestUI();

// ==========================================
// 12. SOCKET.IO MULTIPLAYER СИНХРОНЧЛОЛ
// ==========================================
let socket = null;

function initMultiplayer() {
  try {
    socket = io({ reconnectionAttempts: 10 });

    socket.on('connect', () => {
      console.log('Multiplayer холбогдлоо:', socket.id);
      socket.emit('profile:update', {
        studentCode: currentUser.studentCode,
        role: currentUser.role,
        name: localPlayer.name,
        color: localPlayer.color,
        hairColor: localPlayer.hairColor,
        status: localPlayer.status
      });
      socket.emit('floor:change', currentFloor);
    });

    socket.on('init', (data) => {
      allReviews = data.reviews || {};
      if (data.broadcast) {
        document.getElementById('broadcast-ticker').textContent = data.broadcast;
      }
      for (const id in data.players) {
        if (id !== socket.id) {
          const p = data.players[id];
          otherPlayers[id] = new Character({
            id,
            name: p.name || 'Оюутан',
            role: p.role || 'student',
            status: p.status || 'campus',
            floor: p.floor || 1,
            x: p.x || SPAWN_POINT_F1.x,
            y: p.y || SPAWN_POINT_F1.y,
            color: p.color,
            hairColor: p.hairColor,
            isSitting: p.isSitting,
            hasCoffee: p.hasCoffee,
            isLocal: false
          });
        }
      }
    });

    socket.on('playerJoined', (p) => {
      if (p.id === socket?.id) return;
      otherPlayers[p.id] = new Character({
        id: p.id,
        name: p.name || 'Оюутан',
        role: p.role || 'student',
        status: p.status || 'campus',
        floor: p.floor || 1,
        x: p.x || SPAWN_POINT_F1.x,
        y: p.y || SPAWN_POINT_F1.y,
        color: p.color,
        hairColor: p.hairColor,
        isSitting: p.isSitting,
        hasCoffee: p.hasCoffee,
        isLocal: false
      });
    });

    socket.on('playerMoved', (data) => {
      const target = otherPlayers[data.id];
      if (target) {
        target.targetX = data.x;
        target.targetY = data.y;
        target.dir = data.dir;
        target.moving = data.moving;
      }
    });

    socket.on('playerFloorChanged', ({ id, floor }) => {
      if (otherPlayers[id]) otherPlayers[id].floor = floor;
    });

    socket.on('playerActionUpdated', (data) => {
      if (otherPlayers[data.id]) {
        Object.assign(otherPlayers[data.id], data);
      }
    });

    socket.on('playerProfileUpdated', (p) => {
      if (otherPlayers[p.id]) {
        otherPlayers[p.id].name = p.name;
        otherPlayers[p.id].role = p.role;
        otherPlayers[p.id].color = p.color;
        otherPlayers[p.id].hairColor = p.hairColor;
        otherPlayers[p.id].status = p.status;
      }
    });

    socket.on('playerEmote', ({ id, emote }) => {
      if (id === socket?.id) {
        localPlayer.showEmote(emote);
      } else if (otherPlayers[id]) {
        otherPlayers[id].showEmote(emote);
      }
    });

    socket.on('chat:message', (msg) => {
      addChatMessage(msg);
      if (msg.id === socket?.id) {
        localPlayer.say(msg.text);
      } else if (otherPlayers[msg.id]) {
        otherPlayers[msg.id].say(msg.text);
      }
    });

    socket.on('broadcast:updated', (text) => {
      document.getElementById('broadcast-ticker').textContent = text;
      sound.playChatNotification();
    });

    socket.on('room:reviews:updated', ({ roomId, reviews }) => {
      allReviews[roomId] = reviews;
      if (activeModalRoom && activeModalRoom.id === roomId) {
        renderRoomReviews(roomId);
      }
    });

    socket.on('kicked', (reason) => {
      alert(reason || 'Холболт саллаа.');
      window.location.reload();
    });

    socket.on('playerLeft', (id) => {
      delete otherPlayers[id];
    });
  } catch (err) {
    console.warn('Socket.io error:', err);
  }
}
initMultiplayer();

// Байршил шинэчлэх давтамж
setInterval(() => {
  if (socket && socket.connected) {
    socket.emit('update', {
      x: localPlayer.x,
      y: localPlayer.y,
      dir: localPlayer.dir,
      moving: localPlayer.moving,
      floor: currentFloor
    });
  }
}, 50);

// ==========================================
// 13. ТОГЛООМЫН ГОЛ ДАВТАЛТ (GAME LOOP)
// ==========================================
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Хөдөлгөөн
  let dx = 0;
  let dy = 0;

  if (!isTyping) {
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
  }

  const isMoving = (dx !== 0 || dy !== 0) && !localPlayer.isSitting;
  localPlayer.moving = isMoving;

  if (isMoving) {
    if (Math.abs(dx) > Math.abs(dy)) {
      localPlayer.dir = dx > 0 ? 'right' : 'left';
    } else {
      localPlayer.dir = dy > 0 ? 'down' : 'up';
    }

    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;

    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
    const currentSpeed = isRunning ? localPlayer.speed * 1.6 : localPlayer.speed;
    const moveDist = currentSpeed * dt;

    // Дуу
    sound.playStep(isRunning);

    // Хана мөргөх
    const newX = localPlayer.x + dx * moveDist;
    if (!checkCollision(newX, localPlayer.y)) {
      localPlayer.x = newX;
    }

    const newY = localPlayer.y + dy * moveDist;
    if (!checkCollision(localPlayer.x, newY)) {
      localPlayer.y = newY;
    }

    updateLocation(localPlayer.x, localPlayer.y);
  }

  // Дүрүүд
  localPlayer.update(dt);
  for (const id in otherPlayers) {
    otherPlayers[id].update(dt);
  }

  // Камер дагах
  camera.x += (localPlayer.x - camera.x) * 0.12;
  camera.y += (localPlayer.y - camera.y) * 0.12;

  // Зураглал
  renderer.render(camera, localPlayer, otherPlayers, wallsData, currentFloor, dt);
}

requestAnimationFrame(gameLoop);
