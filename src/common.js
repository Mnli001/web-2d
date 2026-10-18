// ===== Хоёр хуудсанд хамтдаа хэрэглэх функцууд =====

// Бүх хэрэглэгчийн жагсаалтыг localStorage-аас авах
function getUsers() {
  var text = localStorage.getItem('shutis_users');
  if (text == null) {
    return [];
  }
  return JSON.parse(text);
}

// Хэрэглэгчийн жагсаалтыг хадгалах
function saveUsers(list) {
  localStorage.setItem('shutis_users', JSON.stringify(list));
}

// Нэвтэрсэн мэйлийг авах.
// "Намайг сана" сонгосон бол localStorage-д, үгүй бол sessionStorage-д байгаа (хөтөч хаахад устна)
function getLoginEmail() {
  return localStorage.getItem('current_email') || sessionStorage.getItem('current_email');
}

// Одоо нэвтэрсэн хэрэглэгчийг олох (null бол нэвтрээгүй)
function getCurrentUser() {
  var email = getLoginEmail();
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email == email) {
      return users[i];
    }
  }
  return null;
}

// Нэг хэрэглэгчийн мэдээллийг жагсаалтад шинэчлэх
function updateUser(user) {
  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].email == user.email) {
      users[i] = user;
    }
  }
  saveUsers(users);
}

// Гарах: зөвхөн нэвтэрсэн тэмдгийг устгана.
// Профайл, төлөв, байршил (sict_current_user, sict_position) хэвээр үлдэнэ.
function logoutUser() {
  localStorage.removeItem('current_email');
  sessionStorage.removeItem('current_email');
}

// Төлөвийн нэр, өнгө
var statusNames = { online: 'Онлайн', busy: 'Завгүй', away: 'Холдсон', offline: 'Офлайн' };
var placeNames = { school: 'Сургууль дээр байна', home: 'Гэртээ байна' };

// Төлөвийн индикатор (өнгөт цэг + бичиг) HTML буцаана
function statusHtml(user) {
  var s = user.status || 'online';
  var p = user.place || 'school';
  return '<span class="dot ' + s + '"></span>' + statusNames[s] +
    ' <span class="place ' + p + '">' + (p == 'school' ? '🏫 ' : '🏠 ') + placeNames[p] + '</span>';
}

// Тоглоом (main.js) 'sict_current_user' гэсэн нэрээр хэрэглэгч уншдаг тул тэнд бичиж өгнө
function saveForGame(user) {
  var old = JSON.parse(localStorage.getItem('sict_current_user') || '{}');
  var gameStatus = (user.place == 'school') ? 'campus' : 'home';
  if (user.status == 'busy') {
    gameStatus = 'busy';   // тоглоомд завгүй бол улаан цэг гарна
  }
  var gameUser = {
    studentCode: user.code || user.email,
    name: user.name,
    role: user.role,
    status: gameStatus,
    color: old.color || '#2563eb',
    hairColor: old.hairColor || '#2c1e1a'
  };
  localStorage.setItem('sict_current_user', JSON.stringify(gameUser));
}
