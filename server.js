import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'server_data.json');

const PORT = process.env.PORT || 3001;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Өгөгдлийн бааз (Persistent JSON файлтай)
let db = {
  users: [
    { studentCode: 'B210910001', name: 'Тэмүүлэн', email: 'temuulen@must.edu.mn', password: '123', role: 'student', status: 'campus' },
    { studentCode: 'T1001', name: 'Ц.Болд Багш', email: 'bold@must.edu.mn', password: '123', role: 'teacher', status: 'campus' },
    { studentCode: 'ADMIN', name: 'Системийн Админ', email: 'admin@must.edu.mn', password: 'admin', role: 'admin', status: 'campus' }
  ],
  reviews: {
    'r110': [
      { author: 'Тэмүүлэн', rating: 5, comment: 'Компьютерууд нь маш хурдан, Wi-Fi сүлжээ тогтвортой.', date: '2026-10-12' },
      { author: 'Анударь', rating: 5, comment: 'Програмчлалын лаб хийхэд хамгийн тухтай танхим.', date: '2026-10-13' }
    ],
    'canteen_main': [
      { author: 'Бат-Эрдэнэ', rating: 4, comment: 'Хоол нь амттай, гэхдээ 12 цагт дараалал ихтэй байдаг.', date: '2026-10-11' }
    ],
    'gym': [
      { author: 'Төгөлдөр', rating: 5, comment: 'Сагсан бөмбөгийн паркет сайн, тоглоход маш урамтай.', date: '2026-10-10' }
    ]
  },
  broadcast: '📢 ШУТИС МХТС: 2026 оны намрын улирлын сургалтын танхимуудын бүртгэл явагдаж байна!'
};

// Өгөгдөл унших / хадгалах
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      db = Object.assign(db, JSON.parse(raw));
    }
  } catch (err) {
    console.error('Data file read error:', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Data file save error:', err);
  }
}
loadData();

// Онлайн холбогдсон тоглогчид
const players = {};

io.on('connection', (socket) => {
  console.log(`[+] Холбогдлоо: ${socket.id}`);

  // Шинэ тоглогчийн анхны төлөв
  players[socket.id] = {
    id: socket.id,
    studentCode: 'GUEST',
    name: 'Оюутан',
    role: 'student',
    status: 'campus',
    floor: 1, // 1 эсвэл 2-р давхар
    x: 1650,
    y: 1387,
    dir: 'down',
    moving: false,
    color: '#2563eb',
    hairColor: '#2c1e1a',
    isSitting: false,
    hasCoffee: false,
    currentRoomId: 'lobby'
  };

  // Анхны мэдээлэл илгээх
  socket.emit('init', {
    selfId: socket.id,
    players,
    broadcast: db.broadcast,
    reviews: db.reviews
  });

  socket.broadcast.emit('playerJoined', players[socket.id]);

  // ================= 1. AUTHENTICATION & PROFILE =================
  socket.on('auth:login', ({ studentCode, password }, callback) => {
    const user = db.users.find(u => u.studentCode.toUpperCase() === studentCode.toUpperCase() && u.password === password);
    if (user) {
      if (players[socket.id]) {
        players[socket.id].studentCode = user.studentCode;
        players[socket.id].name = user.name;
        players[socket.id].role = user.role;
        players[socket.id].status = user.status || 'campus';
        io.emit('playerProfileUpdated', players[socket.id]);
      }
      callback({ success: true, user: { studentCode: user.studentCode, name: user.name, role: user.role, status: user.status } });
    } else {
      callback({ success: false, message: 'Оюутны код эсвэл нууц үг буруу байна!' });
    }
  });

  socket.on('auth:register', ({ studentCode, name, email, password, role }, callback) => {
    const existing = db.users.find(u => u.studentCode.toUpperCase() === studentCode.toUpperCase());
    if (existing) {
      callback({ success: false, message: 'Энэ оюутны код бүртгэлтэй байна!' });
      return;
    }
    const newUser = {
      studentCode: studentCode.trim().toUpperCase(),
      name: name.trim() || 'Оюутан',
      email: email.trim() || `${studentCode}@must.edu.mn`,
      password,
      role: role || 'student',
      status: 'campus'
    };
    db.users.push(newUser);
    saveData();

    if (players[socket.id]) {
      players[socket.id].studentCode = newUser.studentCode;
      players[socket.id].name = newUser.name;
      players[socket.id].role = newUser.role;
      io.emit('playerProfileUpdated', players[socket.id]);
    }
    callback({ success: true, user: newUser });
  });

  socket.on('profile:update', (data) => {
    if (players[socket.id]) {
      // Нэг хэрэглэгч нэг л дүрстэй байна: хуучин холболт үлдсэн бол салгана
      if (data.studentCode) {
        for (const id in players) {
          if (id !== socket.id && players[id].studentCode === data.studentCode) {
            const oldSocket = io.sockets.sockets.get(id);
            if (oldSocket) oldSocket.disconnect(true);
            delete players[id];
            io.emit('playerLeft', id);
          }
        }
        players[socket.id].studentCode = data.studentCode;
      }
      if (data.role) players[socket.id].role = data.role;
      if (data.name) players[socket.id].name = data.name;
      if (data.color) players[socket.id].color = data.color;
      if (data.hairColor) players[socket.id].hairColor = data.hairColor;
      if (data.status) players[socket.id].status = data.status;
      io.emit('playerProfileUpdated', players[socket.id]);
    }
  });

  // ================= 2. ХӨДӨЛГӨӨН БА ДАВХАР =================
  socket.on('update', (data) => {
    if (players[socket.id]) {
      Object.assign(players[socket.id], data);
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        ...data
      });
    }
  });

  socket.on('floor:change', (floor) => {
    if (players[socket.id]) {
      players[socket.id].floor = floor;
      socket.broadcast.emit('playerFloorChanged', {
        id: socket.id,
        floor
      });
    }
  });

  socket.on('interactive:action', (actionData) => {
    if (players[socket.id]) {
      Object.assign(players[socket.id], actionData);
      socket.broadcast.emit('playerActionUpdated', {
        id: socket.id,
        ...actionData
      });
    }
  });

  // ================= 3. ЧАТ СИСТЕМ =================
  // Нийтийн чат
  socket.on('chat:global', (text) => {
    const sender = players[socket.id];
    const msg = {
      id: socket.id,
      name: sender?.name || 'Оюутан',
      role: sender?.role || 'student',
      text,
      type: 'global',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    io.emit('chat:message', msg);
  });

  // Өрөөний чат (Зөвхөн нэг өрөө/коридорт байгаа хүмүүст)
  socket.on('chat:room', ({ roomId, text }) => {
    const sender = players[socket.id];
    const msg = {
      id: socket.id,
      name: sender?.name || 'Оюутан',
      role: sender?.role || 'student',
      text,
      roomId,
      type: 'room',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    // Нэг өрөөнд байгаа хүмүүсийг шүүх
    for (const [sid, p] of Object.entries(players)) {
      if (p.currentRoomId === roomId && p.floor === sender.floor) {
        io.to(sid).emit('chat:message', msg);
      }
    }
  });

  // Хувийн чат (Direct Message)
  socket.on('chat:private', ({ targetId, text }) => {
    const sender = players[socket.id];
    const msg = {
      fromId: socket.id,
      fromName: sender?.name || 'Оюутан',
      targetId,
      text,
      type: 'private',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    io.to(targetId).emit('chat:message', msg);
    socket.emit('chat:message', msg);
  });

  // Эможи / Reaction шидэх
  socket.on('chat:emote', (emote) => {
    io.emit('playerEmote', {
      id: socket.id,
      emote
    });
  });

  // ================= 4. ӨРӨӨНИЙ СЭТГЭГДЭЛ БА ҮНЭЛГЭЭ =================
  socket.on('room:review:add', ({ roomId, rating, comment }, callback) => {
    const sender = players[socket.id];
    if (!db.reviews[roomId]) db.reviews[roomId] = [];
    const newRev = {
      author: sender?.name || 'Оюутан',
      rating: Number(rating) || 5,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0]
    };
    db.reviews[roomId].unshift(newRev);
    saveData();
    io.emit('room:reviews:updated', { roomId, reviews: db.reviews[roomId] });
    if (callback) callback({ success: true, review: newRev });
  });

  // ================= 5. АДМИН ПАНЕЛ БА ЗАРЛАЛ =================
  socket.on('admin:broadcast', (text) => {
    const sender = players[socket.id];
    if (sender?.role === 'admin' || sender?.role === 'teacher') {
      db.broadcast = text;
      saveData();
      io.emit('broadcast:updated', text);
      console.log(`[Broadcast] ${text}`);
    }
  });

  socket.on('admin:setRole', ({ targetId, role }) => {
    const sender = players[socket.id];
    if (sender?.role === 'admin') {
      if (players[targetId]) {
        players[targetId].role = role;
        io.emit('playerProfileUpdated', players[targetId]);
      }
    }
  });

  socket.on('admin:kick', (targetId) => {
    const sender = players[socket.id];
    if (sender?.role === 'admin') {
      io.to(targetId).emit('kicked', 'Админ таны холболтыг салгалаа.');
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) targetSocket.disconnect(true);
    }
  });

  // ================= САЛАХ =================
  socket.on('disconnect', () => {
    console.log(`[-] Гарлаа: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 ШУТИС МХТС 2D Full Campus Сервер http://localhost:${PORT} дээр ажиллаж байна.`);
});
