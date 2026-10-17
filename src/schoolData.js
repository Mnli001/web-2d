// ШУТИС - Мэдээлэл, Холбооны Технологийн Сургууль (МХТС) 1 ба 2-р давхар
// 2D Газрын зураг, өрөөнүүд, хичээлийн хуваарь, POI тэмдэглэгээ, интерактив объектууд

export const SCALE = 2.5;

export const SPAWN_POINT_F1 = { x: 660 * SCALE, y: 555 * SCALE }; // 1-р давхар Үүд
export const SPAWN_POINT_F2 = { x: 660 * SCALE, y: 430 * SCALE }; // 2-р давхар Шатны хажуу
export const DEFAULT_DOOR_WIDTH = 24 * SCALE; // ~60px
export const WALL_THICKNESS = 8;

// ==========================================
// 1-Р ДАВХРЫН ӨГӨГДӨЛ (FLOOR 1)
// ==========================================
const RAW_FLOOR_AREAS_F1 = [
  { x1: 318, y1: 325, x2: 1082, y2: 515, type: 'classroom' },
  { x1: 630, y1: 515, x2: 690, y2: 595, type: 'lobby' },
  { x1: 137, y1: 355, x2: 318, y2: 905, type: 'classroom' },
  { x1: 617, y1: 25, x2: 737, y2: 325, type: 'north_wing' },
  { x1: 557, y1: 175, x2: 617, y2: 237, type: 'stairs_area' },
  // Коридорууд
  { x1: 245, y1: 408, x2: 1082, y2: 447, type: 'corridor_h' },
  { x1: 208, y1: 355, x2: 245, y2: 905, type: 'corridor_v' },
  { x1: 662, y1: 137, x2: 693, y2: 325, type: 'corridor_v' },
];

const RAW_STAIRS_F1 = [
  { x1: 534, y1: 328, x2: 578, y2: 404, dir: 'up', targetFloor: 2, label: 'Шат (2-р давхар луу)' },
  { x1: 739, y1: 328, x2: 791, y2: 404, dir: 'up', targetFloor: 2, label: 'Шат (2-р давхар луу)' },
  { x1: 249, y1: 518, x2: 314, y2: 568, dir: 'up', targetFloor: 2, label: 'Шат (2-р давхар луу)' },
  { x1: 561, y1: 179, x2: 613, y2: 233, dir: 'up', targetFloor: 2, label: 'Шат (2-р давхар луу)' },
];

const RAW_ROOMS_F1 = [
  {
    id: 'r113', name: '113 Лекцийн танхим', type: 'lecture', floor: 1,
    bounds: { x1: 318, y1: 325, x2: 430, y2: 408 }, labelPos: { x: 374, y: 365 },
    capacity: 120, inCharge: 'Проф. Д.Батмөнх',
    info: '113 - Програмчлал, дискрет математикийн их танхим.',
    schedule: [
      { time: '08:00 - 09:30', course: 'Объект хандалтат програмчлал', lecturer: 'Д.Батмөнх' },
      { time: '10:00 - 11:30', course: 'Дискрет математик', lecturer: 'Ц.Наранчимэг' },
      { time: '13:00 - 14:30', course: 'Алгоритм ба өгөгдлийн бүтэц', lecturer: 'Г.Амар' }
    ]
  },
  {
    id: 'r111', name: '111 Багш нарын өрөө', type: 'office', floor: 1,
    bounds: { x1: 430, y1: 325, x2: 480, y2: 408 }, labelPos: { x: 455, y: 365 },
    capacity: 10, inCharge: 'Тэнхимийн багш нар',
    info: '111 - Програм хангамжийн багш нарын зөвлөгөө өгөх өрөө.',
    schedule: [{ time: '10:00 - 16:00', course: 'Оюутны зөвлөгөөний цаг', lecturer: 'Бүх багш нар' }]
  },
  {
    id: 'wc1_left', name: 'WC (Эрэгтэй/Эмэгтэй)', type: 'wc', floor: 1,
    bounds: { x1: 480, y1: 325, x2: 530, y2: 408 }, labelPos: { x: 505, y: 365 },
    capacity: 8, inCharge: 'Үйлчилгээний алба',
    info: '1-р давхрын ариун цэврийн өрөө.',
    schedule: [{ time: '07:00 - 20:00', course: 'Нээлттэй', lecturer: 'Үйлчилгээний алба' }]
  },
  {
    id: 'r109', name: '109 Хувцасны өлгүүр', type: 'office', floor: 1,
    bounds: { x1: 582, y1: 325, x2: 650, y2: 408 }, labelPos: { x: 616, y: 365 },
    capacity: 300, inCharge: 'Өлгүүрийн ажилтан',
    info: '109 - Оюутан, багш нарын гадуур хувцас хадгалах хэсэг.',
    schedule: [{ time: '07:30 - 19:30', course: 'Ажиллах цаг', lecturer: 'Үйлчилгээний алба' }]
  },
  {
    id: 'study_north', name: 'Бие даан суралцах орчин', type: 'lounge', floor: 1,
    bounds: { x1: 650, y1: 325, x2: 735, y2: 408 }, labelPos: { x: 692, y: 365 },
    capacity: 40, inCharge: 'Оюутны холбоо',
    info: 'Оюутнууд хичээл давтах, бие даалт хийх нээлттэй бүс.',
    schedule: [{ time: '08:00 - 21:00', course: 'Чөлөөт суралцах цаг', lecturer: 'Нээлттэй' }]
  },
  {
    id: 'r101', name: '101 Хурлын их танхим', type: 'hall', floor: 1,
    bounds: { x1: 960, y1: 325, x2: 1082, y2: 408 }, labelPos: { x: 1021, y: 365 },
    capacity: 150, inCharge: 'Эрдмийн зөвлөл',
    info: '101 - Сургуулийн их хурал, төгсөлтийн ажил хамгаалах танхим.',
    schedule: [{ time: '14:00 - 16:00', course: 'Эрдэм шинжилгээний хурал', lecturer: 'МХТС Захиргаа' }]
  },
  {
    id: 'r114', name: '114 Лекцийн танхим', type: 'lecture', floor: 1,
    bounds: { x1: 318, y1: 447, x2: 430, y2: 515 }, labelPos: { x: 374, y: 481 },
    capacity: 100, inCharge: 'Доц. Ч.Эрдэнэ',
    info: '114 - Мэдээллийн аюулгүй байдлын лекцийн танхим.',
    schedule: [{ time: '09:00 - 11:30', course: 'Сүлжээний аюулгүй байдал', lecturer: 'Ч.Эрдэнэ' }]
  },
  {
    id: 'r110', name: '110 МТ Компьютерийн Лаборатори', type: 'lab', floor: 1,
    bounds: { x1: 485, y1: 447, x2: 583, y2: 515 }, labelPos: { x: 534, y: 481 },
    capacity: 45, inCharge: 'Ахлах багш Б.Мөнхбат',
    info: '110 - МХТС-ийн өндөр хүчин чадалтай компьютерийн лаб. 40 PC, өндөр хурдны сүлжээтэй.',
    schedule: [
      { time: '08:00 - 10:00', course: 'Вэб програмчлал Лаб', lecturer: 'Б.Мөнхбат' },
      { time: '10:30 - 12:30', course: 'Өгөгдлийн сан Лаб', lecturer: 'Т.Энхжаргал' },
      { time: '14:00 - 16:00', course: 'Гар утасны апп хөгжүүлэлт', lecturer: 'Н.Билгүүн' }
    ]
  },
  {
    id: 'lobby', name: 'Лобби / Үүдний танхим', type: 'lobby', floor: 1,
    bounds: { x1: 583, y1: 447, x2: 735, y2: 595 }, labelPos: { x: 660, y: 481 },
    capacity: 150, inCharge: 'Мэдээллийн алба',
    info: 'ШУТИС МХТС-ийн төв үүд, хүлээн авах лобби, кофе машин.',
    schedule: [{ time: '07:00 - 21:00', course: 'Орох гарах цаг', lecturer: 'Харуул хамгаалалт' }]
  },
  {
    id: 'r108', name: '108 Сургалтын алба', type: 'office', floor: 1,
    bounds: { x1: 735, y1: 447, x2: 865, y2: 515 }, labelPos: { x: 800, y: 481 },
    capacity: 15, inCharge: 'Сургалтын албаны дарга',
    info: '108 - Хичээл сонголт, дүн, голч дүнгийн тодорхойлолт авах өрөө.',
    schedule: [{ time: '09:00 - 17:00', course: 'Оюутан хүлээн авах', lecturer: 'Менежерүүд' }]
  },
  {
    id: 'r102', name: '102 Захирлын албан өрөө', type: 'office', floor: 1,
    bounds: { x1: 958, y1: 447, x2: 1082, y2: 515 }, labelPos: { x: 1000, y: 481 },
    capacity: 20, inCharge: 'МХТС-ийн Захирал',
    info: '102 - Сургуулийн Захирлын албан өрөө.',
    schedule: [{ time: '14:00 - 16:00', course: 'Оюутан, багш хүлээн авах', lecturer: 'Сургуулийн захирал' }]
  },
  {
    id: 'canteen_main', name: 'Цайны газар (Оюутны хоолны заал)', type: 'canteen', floor: 1,
    bounds: { x1: 617, y1: 25, x2: 662, y2: 185 }, labelPos: { x: 641, y: 105 },
    capacity: 80, inCharge: 'Хоолны алба',
    info: 'Халуун хоол, цай кофегоор үйлчлэх оюутны цайны газар.',
    schedule: [{ time: '08:30 - 18:00', course: 'Хоолоор үйлчлэх', lecturer: 'Цайны газар' }]
  },
  {
    id: 'gym', name: '135 Спорт заал', type: 'gym', floor: 1,
    bounds: { x1: 662, y1: 25, x2: 737, y2: 137 }, labelPos: { x: 702, y: 80 },
    capacity: 100, inCharge: 'Биеийн тамирын тэнхим',
    info: '135 - Сагсан бөмбөг, гар бөмбөгийн стандартад нийцсэн заал.',
    schedule: [
      { time: '08:00 - 12:00', course: 'Биеийн тамирын хичээл', lecturer: 'С.Мягмар' },
      { time: '16:00 - 19:00', course: 'Оюутны сагсан бөмбөгийн дугуйлан', lecturer: 'Шигшээ баг' }
    ]
  },
  {
    id: 'r117', name: '117 Лекцийн танхим', type: 'lecture', floor: 1,
    bounds: { x1: 137, y1: 420, x2: 208, y2: 540 }, labelPos: { x: 172, y: 480 },
    capacity: 90, inCharge: 'Багш Б.Хулан',
    info: '117 - Сүлжээ, тоон электроникийн лекц.',
    schedule: [{ time: '10:00 - 12:00', course: 'Компьютерийн сүлжээ', lecturer: 'Б.Хулан' }]
  },
  {
    id: 'r119', name: '119 Медиа Студи', type: 'hall', floor: 1,
    bounds: { x1: 137, y1: 540, x2: 208, y2: 620 }, labelPos: { x: 172, y: 580 },
    capacity: 25, inCharge: 'Медиа төв',
    info: '119 - Цахим хичээл бичлэг, подкаст хийх мэргэжлийн студи.',
    schedule: [{ time: '13:00 - 17:00', course: 'Видео хичээл бичлэг', lecturer: 'Студи баг' }]
  },
  {
    id: 'r127', name: '127 AI & Data Лаборатори', type: 'lab', floor: 1,
    bounds: { x1: 137, y1: 800, x2: 208, y2: 905 }, labelPos: { x: 172, y: 852 },
    capacity: 40, inCharge: 'Доктор Ж.Золжаргал',
    info: '127 - Хиймэл оюун, машин сургалт, дата сайнсын лаборатори.',
    schedule: [{ time: '10:00 - 12:30', course: 'Машин сургалт практик', lecturer: 'Ж.Золжаргал' }]
  }
];

// ==========================================
// 2-Р ДАВХРЫН ӨГӨГДӨЛ (FLOOR 2)
// ==========================================
const RAW_FLOOR_AREAS_F2 = [
  { x1: 318, y1: 325, x2: 1082, y2: 515, type: 'classroom' },
  { x1: 137, y1: 355, x2: 318, y2: 905, type: 'classroom' },
  // Коридорууд
  { x1: 245, y1: 408, x2: 1082, y2: 447, type: 'corridor_h' },
  { x1: 208, y1: 355, x2: 245, y2: 905, type: 'corridor_v' },
];

const RAW_STAIRS_F2 = [
  { x1: 534, y1: 328, x2: 578, y2: 404, dir: 'down', targetFloor: 1, label: 'Шат (1-р давхар луу)' },
  { x1: 739, y1: 328, x2: 791, y2: 404, dir: 'down', targetFloor: 1, label: 'Шат (1-р давхар луу)' },
  { x1: 249, y1: 518, x2: 314, y2: 568, dir: 'down', targetFloor: 1, label: 'Шат (1-р давхар луу)' },
];

const RAW_ROOMS_F2 = [
  {
    id: 'r220', name: '220 Номын сан & Цахим танхим', type: 'hall', floor: 2,
    bounds: { x1: 900, y1: 325, x2: 1082, y2: 515 }, labelPos: { x: 991, y: 420 },
    capacity: 120, inCharge: 'Номын санч Д.Саран',
    info: '220 - МХТС-ийн төв номын сан, ном зээлэх болон цахим уншлагын их танхим.',
    schedule: [{ time: '08:30 - 20:00', course: 'Уншлагын цаг', lecturer: 'Нээлттэй' }]
  },
  {
    id: 'r201', name: '201 Програм хангамжийн тэнхим', type: 'office', floor: 2,
    bounds: { x1: 735, y1: 447, x2: 865, y2: 515 }, labelPos: { x: 800, y: 481 },
    capacity: 20, inCharge: 'Тэнхимийн эрхлэгч',
    info: '201 - Програм хангамжийн тэнхимийн эрхлэгч ба багш нарын өрөө.',
    schedule: [{ time: '09:00 - 18:00', course: 'Албан цаг', lecturer: 'ПХ Тэнхим' }]
  },
  {
    id: 'r202', name: '202 Мэдээллийн сүлжээний тэнхим', type: 'office', floor: 2,
    bounds: { x1: 583, y1: 447, x2: 735, y2: 515 }, labelPos: { x: 659, y: 481 },
    capacity: 20, inCharge: 'Тэнхимийн эрхлэгч',
    info: '202 - Сүлжээний тэнхимийн алба.',
    schedule: [{ time: '09:00 - 18:00', course: 'Албан цаг', lecturer: 'Сүлжээний Тэнхим' }]
  },
  {
    id: 'r210', name: '210 Их Лаборатори', type: 'lab', floor: 2,
    bounds: { x1: 485, y1: 447, x2: 583, y2: 515 }, labelPos: { x: 534, y: 481 },
    capacity: 45, inCharge: 'Багш О.Ганбат',
    info: '210 - Програм хангамжийн төслийн лаборатори.',
    schedule: [{ time: '10:00 - 12:00', course: 'Төслийн менежмент лаб', lecturer: 'О.Ганбат' }]
  },
  {
    id: 'r213', name: '213 Лекцийн танхим', type: 'lecture', floor: 2,
    bounds: { x1: 318, y1: 325, x2: 430, y2: 408 }, labelPos: { x: 374, y: 365 },
    capacity: 110, inCharge: 'Доц. П.Төмөр',
    info: '213 - Кибер аюулгүй байдлын их танхим.',
    schedule: [{ time: '13:00 - 15:00', course: 'Криптограф ба сүлжээ', lecturer: 'П.Төмөр' }]
  },
  {
    id: 'r230', name: '230 Багш нарын хурлын заал', type: 'hall', floor: 2,
    bounds: { x1: 650, y1: 325, x2: 735, y2: 408 }, labelPos: { x: 692, y: 365 },
    capacity: 40, inCharge: 'Захиргаа',
    info: '230 - Тэнхимүүдийн хамтарсан хурлын өрөө.',
    schedule: [{ time: '15:00 - 17:00', course: 'Тэнхимийн хурал', lecturer: 'Багш нар' }]
  }
];

// Координатыг SCALE-ээр үржүүлж экспортолно
function scaleArea(arr) {
  return arr.map(a => ({
    ...a,
    x1: a.x1 * SCALE, y1: a.y1 * SCALE,
    x2: a.x2 * SCALE, y2: a.y2 * SCALE
  }));
}

function scaleRooms(arr) {
  return arr.map(r => ({
    ...r,
    bounds: {
      x1: r.bounds.x1 * SCALE, y1: r.bounds.y1 * SCALE,
      x2: r.bounds.x2 * SCALE, y2: r.bounds.y2 * SCALE
    },
    labelPos: {
      x: r.labelPos.x * SCALE, y: r.labelPos.y * SCALE
    }
  }));
}

export const FLOOR_AREAS_F1 = scaleArea(RAW_FLOOR_AREAS_F1);
export const STAIRS_F1 = scaleArea(RAW_STAIRS_F1);
export const ROOMS_F1 = scaleRooms(RAW_ROOMS_F1);

export const FLOOR_AREAS_F2 = scaleArea(RAW_FLOOR_AREAS_F2);
export const STAIRS_F2 = scaleArea(RAW_STAIRS_F2);
export const ROOMS_F2 = scaleRooms(RAW_ROOMS_F2);

export const ALL_ROOMS = [...ROOMS_F1, ...ROOMS_F2];

// ==========================================
// POI МАРКЕРУУД (POINTS OF INTEREST)
// ==========================================
export const POI_MARKERS = [
  { icon: '🚪', label: 'Гол үүд', x: 660 * SCALE, y: 580 * SCALE, floor: 1 },
  { icon: '☕', label: 'Кофе аппарат (Лобби)', x: 642 * SCALE, y: 470 * SCALE, floor: 1 },
  { icon: '☕', label: 'Кофе лангуу (Цайны газар)', x: 630 * SCALE, y: 80 * SCALE, floor: 1 },
  { icon: '🏀', label: 'Спорт заал', x: 700 * SCALE, y: 80 * SCALE, floor: 1 },
  { icon: '💻', label: '110 МТ Лаб', x: 534 * SCALE, y: 481 * SCALE, floor: 1 },
  { icon: '👔', label: '102 Захирал', x: 1000 * SCALE, y: 481 * SCALE, floor: 1 },
  { icon: '🚻', label: 'WC', x: 505 * SCALE, y: 365 * SCALE, floor: 1 },
  { icon: '⬆', label: 'Шат (2-р давхар луу)', x: 556 * SCALE, y: 366 * SCALE, floor: 1 },
  { icon: '📚', label: '220 Номын сан', x: 991 * SCALE, y: 420 * SCALE, floor: 2 },
  { icon: '💻', label: '210 Лаб', x: 534 * SCALE, y: 481 * SCALE, floor: 2 },
  { icon: '⬇', label: 'Шат (1-р давхар луу)', x: 556 * SCALE, y: 366 * SCALE, floor: 2 },
];

// ==========================================
// ИНТЕРАКТИВ ОБЪЕКТУУД (INTERACTIVE OBJECTS)
// ==========================================
export const INTERACTIVE_OBJECTS = [
  {
    id: 'coffee_lobby',
    type: 'coffee_machine',
    label: 'Кофе аппарат [E]',
    x: 640 * SCALE,
    y: 468 * SCALE,
    floor: 1,
    action: 'drink_coffee'
  },
  {
    id: 'coffee_canteen',
    type: 'coffee_machine',
    label: 'Кофе авах [E]',
    x: 630 * SCALE,
    y: 80 * SCALE,
    floor: 1,
    action: 'drink_coffee'
  },
  {
    id: 'lounge_chair_1',
    type: 'chair',
    label: 'Буйдан дээр суух [E]',
    x: 692 * SCALE,
    y: 365 * SCALE,
    floor: 1,
    action: 'sit'
  },
  {
    id: 'director_chair',
    type: 'chair',
    label: 'Захирлын сандалд суух [E]',
    x: 1048 * SCALE,
    y: 467 * SCALE,
    floor: 1,
    action: 'sit'
  }
];

// ==========================================
// ХАНА ҮҮСГЭХ (WALL BUILDER)
// ==========================================
function createWall(x1, y1, x2, y2, doors = [], dw = DEFAULT_DOOR_WIDTH) {
  const isHoriz = y1 === y2;
  const segments = [];
  const doorBoxes = [];

  const sx1 = x1 * SCALE;
  const sy1 = y1 * SCALE;
  const sx2 = x2 * SCALE;
  const sy2 = y2 * SCALE;

  const start = isHoriz ? Math.min(sx1, sx2) : Math.min(sy1, sy2);
  const end = isHoriz ? Math.max(sx1, sx2) : Math.max(sy1, sy2);
  const scaledDoors = doors.map(d => d * SCALE).sort((a, b) => a - b);

  let current = start;

  for (const d of scaledDoors) {
    const doorStart = Math.max(start, d - dw / 2);
    const doorEnd = Math.min(end, d + dw / 2);

    if (doorStart > current + 3) {
      if (isHoriz) {
        segments.push({ x1: current, y1: sy1, x2: doorStart, y2: sy2 });
      } else {
        segments.push({ x1: sx1, y1: current, x2: sx2, y2: doorEnd });
      }
    }

    if (isHoriz) {
      doorBoxes.push({
        x: d, y: sy1, isHoriz: true, width: dw,
        rect: { x1: doorStart, y1: sy1 - 8, x2: doorEnd, y2: sy1 + 8 }
      });
    } else {
      doorBoxes.push({
        x: sx1, y: d, isHoriz: false, width: dw,
        rect: { x1: sx1 - 8, y1: doorStart, x2: sx1 + 8, y2: doorEnd }
      });
    }

    current = doorEnd;
  }

  if (end > current + 3) {
    if (isHoriz) {
      segments.push({ x1: current, y1: sy1, x2: end, y2: sy2 });
    } else {
      segments.push({ x1: sx1, y1: current, x2: sx2, y2: end });
    }
  }

  return { segments, doors: doorBoxes };
}

export function buildWallsForFloor(floor = 1) {
  const rawWallsF1 = [
    { x1: 318, y1: 325, x2: 617, y2: 325 },
    { x1: 617, y1: 325, x2: 660, y2: 325, doors: [640] },
    { x1: 693, y1: 325, x2: 737, y2: 325 },
    { x1: 737, y1: 325, x2: 1082, y2: 325 },
    { x1: 1082, y1: 325, x2: 1082, y2: 515 },
    { x1: 318, y1: 325, x2: 318, y2: 408 },
    { x1: 318, y1: 447, x2: 318, y2: 905 },
    { x1: 318, y1: 515, x2: 630, y2: 515 },
    { x1: 690, y1: 515, x2: 1082, y2: 515 },
    { x1: 630, y1: 515, x2: 630, y2: 595 },
    { x1: 690, y1: 515, x2: 690, y2: 595 },
    { x1: 630, y1: 595, x2: 690, y2: 595, doors: [660], dw: 40 * SCALE },
    [430, 480, 530, 582, 650, 735, 795, 835, 858, 892, 960].map(x => ({ x1: x, y1: 325, x2: x, y2: 408 })),
    { x1: 318, y1: 408, x2: 530, y2: 408, doors: [345, 455, 505] },
    { x1: 582, y1: 408, x2: 650, y2: 408, doors: [625] },
    { x1: 795, y1: 408, x2: 892, y2: 408, doors: [815, 872] },
    { x1: 960, y1: 408, x2: 1082, y2: 408, doors: [1055] },
    { x1: 892, y1: 372, x2: 960, y2: 372, doors: [935] },
    { x1: 318, y1: 447, x2: 583, y2: 447, doors: [345, 455, 510] },
    { x1: 735, y1: 447, x2: 1082, y2: 447, doors: [760, 888, 935, 975] },
    [430, 485, 583, 735, 865, 912, 958, 1043].map(x => ({ x1: x, y1: 447, x2: x, y2: 515 })),
    { x1: 137, y1: 355, x2: 137, y2: 905 },
    { x1: 137, y1: 355, x2: 318, y2: 355 },
    { x1: 137, y1: 905, x2: 318, y2: 905 },
    { x1: 208, y1: 355, x2: 208, y2: 905, doors: [380, 432, 575, 635, 700, 850] },
    [420, 540, 620, 655, 800].map(y => ({ x1: 137, y1: y, x2: 208, y2: y })),
    { x1: 245, y1: 475, x2: 245, y2: 905, doors: [492, 545, 595, 635, 662, 705, 770, 818, 870] },
    [475, 515, 570, 620, 650, 675, 740, 800, 835].map(y => ({ x1: 245, y1: y, x2: 318, y2: y })),
    { x1: 617, y1: 25, x2: 737, y2: 25 },
    { x1: 617, y1: 25, x2: 617, y2: 175 },
    { x1: 737, y1: 25, x2: 737, y2: 325 },
    { x1: 662, y1: 25, x2: 662, y2: 185 },
    { x1: 662, y1: 137, x2: 737, y2: 137, doors: [678] },
    { x1: 617, y1: 185, x2: 662, y2: 185, doors: [640] },
    { x1: 557, y1: 175, x2: 617, y2: 175 },
    { x1: 557, y1: 175, x2: 557, y2: 237 },
    { x1: 557, y1: 237, x2: 617, y2: 237 },
    { x1: 617, y1: 240, x2: 662, y2: 240 },
    { x1: 617, y1: 240, x2: 617, y2: 325 },
    { x1: 662, y1: 240, x2: 662, y2: 325 },
    { x1: 693, y1: 137, x2: 693, y2: 325, doors: [155, 185, 225, 262, 300] },
    [170, 198, 250, 283].map(y => ({ x1: 693, y1: y, x2: 737, y2: y })),
  ].flat();

  const rawWallsF2 = [
    { x1: 318, y1: 325, x2: 1082, y2: 325 },
    { x1: 1082, y1: 325, x2: 1082, y2: 515 },
    { x1: 318, y1: 515, x2: 1082, y2: 515 },
    { x1: 318, y1: 325, x2: 318, y2: 515 },
    { x1: 318, y1: 408, x2: 1082, y2: 408, doors: [374, 534, 692, 900] },
    { x1: 318, y1: 447, x2: 1082, y2: 447, doors: [374, 534, 659, 800] },
    [430, 583, 735, 900].map(x => ({ x1: x, y1: 325, x2: x, y2: 408 })),
    [430, 583, 735, 900].map(x => ({ x1: x, y1: 447, x2: x, y2: 515 })),
    { x1: 137, y1: 355, x2: 137, y2: 905 },
    { x1: 137, y1: 355, x2: 318, y2: 355 },
    { x1: 137, y1: 905, x2: 318, y2: 905 },
    { x1: 208, y1: 355, x2: 208, y2: 905, doors: [420, 600, 800] },
    { x1: 245, y1: 355, x2: 245, y2: 905, doors: [420, 600, 800] },
  ].flat();

  const list = floor === 2 ? rawWallsF2 : rawWallsF1;
  const allSegments = [];
  const allDoors = [];

  for (const w of list) {
    const res = createWall(w.x1, w.y1, w.x2, w.y2, w.doors || [], w.dw || DEFAULT_DOOR_WIDTH);
    allSegments.push(...res.segments);
    allDoors.push(...res.doors);
  }

  return { segments: allSegments, doors: allDoors };
}
