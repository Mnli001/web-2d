// ===== Профайл хуудас =====

var user = getCurrentUser();
if (user == null) {
  // Нэвтрээгүй бол login руу буцаана
  window.location.href = 'login.html';
}

var avatarImg = document.getElementById('avatar-img');
var emptyAvatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#ccc"/></svg>');

// Хэрэглэгчийн мэдээллийг талбаруудад бөглөх
function fillPage() {
  var roleNames = { student: 'Оюутан', teacher: 'Багш', admin: 'Админ' };
  var roleText = document.getElementById('role-text');
  roleText.innerText = roleNames[user.role];
  roleText.className = 'role ' + user.role;
  if (user.lastLogin) {
    document.getElementById('last-login').innerText = 'Сүүлд нэвтэрсэн: ' + user.lastLogin;
  }
  document.getElementById('p-name').value = user.name;
  document.getElementById('name-text').innerText = user.name;
  document.getElementById('p-status').value = user.status;
  document.getElementById('p-place').value = user.place;
  avatarImg.src = user.avatar || emptyAvatar;
  showStatus();
}

// Төлөвийн индикаторыг шинэчлэх
function showStatus() {
  document.getElementById('status-box').innerHTML = statusHtml(user);
}

// Нэр бичих үед дээрх нэр шууд солигдоно
document.getElementById('p-name').oninput = function () {
  document.getElementById('name-text').innerText = this.value;
};

// Сонголт өөрчлөхөд индикатор шууд солигдоно
document.getElementById('p-status').onchange = function () {
  user.status = this.value;
  showStatus();
};
document.getElementById('p-place').onchange = function () {
  user.place = this.value;
  showStatus();
};

// Зураг сонгоход
document.getElementById('p-file').onchange = function () {
  var file = this.files[0];
  if (file == null) return;
  if (file.size > 200000) {
    alert('Зураг хэт том байна. 200KB-аас бага зураг сонгоно уу.');
    return;
  }
  var reader = new FileReader();
  reader.onload = function () {
    user.avatar = reader.result;      // зургийг текст болгон хадгална
    avatarImg.src = user.avatar;
  };
  reader.readAsDataURL(file);
};

// Хадгалах товч
function saveProfile() {
  var newName = document.getElementById('p-name').value.trim();
  if (newName != '') {
    user.name = newName;
  }
  user.status = document.getElementById('p-status').value;
  user.place = document.getElementById('p-place').value;

  updateUser(user);       // жагсаалтад хадгалах
  saveForGame(user);      // тоглоомд мэдэгдэх
  fillPage();
  showRolePart();
  document.getElementById('message').innerText = 'Хадгалагдлаа!';
}

// Гарах: нэвтэрсэн тэмдгийг устгана, мэдээлэл хэвээр үлдэнэ
function logout() {
  logoutUser();
  window.location.href = 'login.html';
}

// Тэмдэгтийг аюулгүй болгох (нэр дотор < > байвал)
function safe(text) {
  var div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// Эрхийн систем: багш оюутнуудыг, админ бүх хэрэглэгчийг харна
function showRolePart() {
  var part = document.getElementById('role-part');
  var table = document.getElementById('user-table');
  var title = document.getElementById('role-title');

  if (user.role == 'student') {
    return;   // оюутан энэ хэсгийг хардаггүй
  }
  part.className = '';
  var list = getUsers();
  var html = '';

  if (user.role == 'admin') {
    title.innerText = 'Админ: бүх хэрэглэгч';
    html = '<tr><th>Нэр</th><th>Төлөв</th><th>Эрх</th></tr>';
    for (var i = 0; i < list.length; i++) {
      var u = list[i];
      html += '<tr><td>' + safe(u.name) + '</td><td>' + statusHtml(u) + '</td><td>' +
        '<select onchange="changeRole(\'' + u.email + '\', this.value)">' +
        '<option value="student"' + (u.role == 'student' ? ' selected' : '') + '>Оюутан</option>' +
        '<option value="teacher"' + (u.role == 'teacher' ? ' selected' : '') + '>Багш</option>' +
        '<option value="admin"' + (u.role == 'admin' ? ' selected' : '') + '>Админ</option>' +
        '</select></td></tr>';
    }
  } else {
    title.innerText = 'Багш: оюутнуудын төлөв';
    html = '<tr><th>Нэр</th><th>Код</th><th>Төлөв</th></tr>';
    for (var j = 0; j < list.length; j++) {
      if (list[j].role == 'student') {
        html += '<tr><td>' + safe(list[j].name) + '</td><td>' + safe(list[j].code) + '</td><td>' + statusHtml(list[j]) + '</td></tr>';
      }
    }
  }
  table.innerHTML = html;
}

// Админ эрх солих
function changeRole(email, newRole) {
  if (email == user.email) {
    alert('Өөрийнхөө эрхийг өөрчлөх боломжгүй');
    showRolePart();
    return;
  }
  var list = getUsers();
  for (var i = 0; i < list.length; i++) {
    if (list[i].email == email) {
      list[i].role = newRole;
    }
  }
  saveUsers(list);
}

fillPage();
showRolePart();
