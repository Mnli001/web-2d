// ===== Нэвтрэх / Бүртгүүлэх =====

// Анх удаа нээхэд админ хэрэглэгч үүсгэнэ
var users = getUsers();
if (users.length == 0) {
  users.push({
    code: '',
    name: 'Админ',
    email: 'admin@shutis.mn',
    password: 'admin123',
    role: 'admin',
    status: 'online',
    place: 'school',
    avatar: ''
  });
  saveUsers(users);
}

// Өмнө нь нэвтэрсэн бол шууд тоглоом руу оруулна
if (getCurrentUser() != null) {
  window.location.href = 'index.html';
}

// Аль хэсгийг харуулахыг солих
function showPart(name) {
  document.getElementById('login-part').className = (name == 'login') ? '' : 'hide';
  document.getElementById('register-part').className = (name == 'register') ? '' : 'hide';
  document.getElementById('message').innerText = '';
}

function showMessage(text, isOk) {
  var box = document.getElementById('message');
  box.innerText = text;
  box.className = isOk ? 'ok' : 'error';
}

// Эрх солиход код талбарын бичгийг солих
function changeCodeLabel() {
  var role = document.getElementById('r-role').value;
  var label = document.getElementById('r-code-label');
  var input = document.getElementById('r-code');
  if (role == 'teacher') {
    label.innerText = 'Багшийн код';
    input.placeholder = 'Жишээ нь: T1001';
  } else {
    label.innerText = 'Оюутны код';
    input.placeholder = 'Жишээ нь: B210910001';
  }
}

// Бүртгүүлэх товч дарахад
function register() {
  var name = document.getElementById('r-name').value.trim();
  var email = document.getElementById('r-email').value.trim().toLowerCase();
  var code = document.getElementById('r-code').value.trim().toUpperCase();
  var role = document.getElementById('r-role').value;
  var pass = document.getElementById('r-pass').value;

  // Шалгалтууд
  if (name == '' || email == '' || pass == '') {
    showMessage('Бүх талбарыг бөглөнө үү', false);
    return;
  }
  if (pass.length < 6) {
    showMessage('Нууц үг 6-аас дээш тэмдэгттэй байх ёстой', false);
    return;
  }
  if (code == '') {
    if (role == 'teacher') {
      showMessage('Багшийн код оруулна уу', false);
    } else {
      showMessage('Оюутны код оруулна уу', false);
    }
    return;
  }

  // Давхардсан эсэхийг шалгах
  var list = getUsers();
  for (var i = 0; i < list.length; i++) {
    if (list[i].email == email) {
      showMessage('Энэ мэйл бүртгэлтэй байна', false);
      return;
    }
    if (code != '' && list[i].code == code) {
      showMessage('Энэ код бүртгэлтэй байна', false);
      return;
    }
  }

  // Шинэ хэрэглэгч нэмэх
  list.push({
    code: code,
    name: name,
    email: email,
    password: pass,
    role: role,
    status: 'online',
    place: 'school',
    avatar: ''
  });
  saveUsers(list);

  showPart('login');
  showMessage('Амжилттай бүртгэгдлээ. Одоо нэвтэрнэ үү.', true);
}

// Нэвтрэх товч дарахад
function login() {
  var id = document.getElementById('l-id').value.trim().toLowerCase();
  var pass = document.getElementById('l-pass').value;

  var list = getUsers();
  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    // Код эсвэл мэйл таарч, нууц үг зөв бол
    if ((u.email == id || u.code.toLowerCase() == id) && u.password == pass) {
      // "Намайг сана" бол localStorage, үгүй бол sessionStorage
      if (document.getElementById('l-remember').checked) {
        localStorage.setItem('current_email', u.email);
      } else {
        sessionStorage.setItem('current_email', u.email);
      }
      u.lastLogin = new Date().toLocaleString();       // сүүлд нэвтэрсэн цаг
      updateUser(u);
      saveForGame(u);                                  // тоглоомд мэдээлэл өгнө
      window.location.href = 'index.html';             // тоглоом руу очно
      return;
    }
  }
  showMessage('Код/мэйл эсвэл нууц үг буруу байна', false);
}
