// ШУТИС МХТС 1 ба 2-р давхрын 2D Архитектур, Тавилга, POI Маркер, Интерактив Зурагч

import {
  FLOOR_AREAS_F1, STAIRS_F1, ROOMS_F1,
  FLOOR_AREAS_F2, STAIRS_F2, ROOMS_F2,
  POI_MARKERS, INTERACTIVE_OBJECTS, SCALE
} from './schoolData.js';

export class Renderer2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.zoom = 1.0;
    this.minZoom = 0.35;
    this.maxZoom = 2.4;

    this.showPOIs = true;
    this.targetBeacon = null; // Хайсан өрөөг заах лугших цагираг
    this.beaconTimer = 0;

    this.createTilePatterns();
  }

  createTilePatterns() {
    // 1. Ангийн том плитаны хээ
    const c1 = document.createElement('canvas');
    c1.width = c1.height = 48;
    const ctx1 = c1.getContext('2d');
    ctx1.fillStyle = '#f5f0e4';
    ctx1.fillRect(0, 0, 48, 48);
    ctx1.strokeStyle = '#e2dac6';
    ctx1.lineWidth = 1;
    ctx1.strokeRect(0, 0, 48, 48);
    this.tilePattern = this.ctx.createPattern(c1, 'repeat');

    // 2. Коридорын өргөн улаан-хүрэн судал хээ
    const c2 = document.createElement('canvas');
    c2.width = c2.height = 64;
    const ctx2 = c2.getContext('2d');
    ctx2.fillStyle = '#eddcc7';
    ctx2.fillRect(0, 0, 64, 64);
    ctx2.fillStyle = '#8b3e36';
    ctx2.fillRect(16, 0, 32, 64);
    this.corridorVPattern = this.ctx.createPattern(c2, 'repeat');

    const c3 = document.createElement('canvas');
    c3.width = c3.height = 64;
    const ctx3 = c3.getContext('2d');
    ctx3.fillStyle = '#eddcc7';
    ctx3.fillRect(0, 0, 64, 64);
    ctx3.fillStyle = '#8b3e36';
    ctx3.fillRect(0, 16, 64, 32);
    this.corridorHPattern = this.ctx.createPattern(c3, 'repeat');

    // 3. Спорт заалны модны паркет
    const cGym = document.createElement('canvas');
    cGym.width = 60; cGym.height = 24;
    const gctx = cGym.getContext('2d');
    gctx.fillStyle = '#dfab68';
    gctx.fillRect(0, 0, 60, 24);
    gctx.strokeStyle = '#c99450';
    gctx.lineWidth = 1;
    gctx.strokeRect(0, 0, 60, 24);
    gctx.strokeRect(30, 12, 60, 24);
    this.gymPattern = this.ctx.createPattern(cGym, 'repeat');

    // 4. Номын сангийн хивсэнцэр
    const cLib = document.createElement('canvas');
    cLib.width = cLib.height = 40;
    const lctx = cLib.getContext('2d');
    lctx.fillStyle = '#334155';
    lctx.fillRect(0, 0, 40, 40);
    lctx.strokeStyle = '#475569';
    lctx.strokeRect(0, 0, 40, 40);
    this.libraryPattern = this.ctx.createPattern(cLib, 'repeat');
  }

  setBeacon(x, y) {
    this.targetBeacon = { x, y };
    this.beaconTimer = 6.0; // 6 секунд лугшиж заана
  }

  // Бүх орчныг зурах
  render(camera, localPlayer, otherPlayers, wallsData, currentFloor = 1, dt = 0.016) {
    const { ctx, canvas } = this;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Гадна зүлэг
    ctx.fillStyle = currentFloor === 1 ? '#8fad7e' : '#475569';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-camera.x, -camera.y);

    const floorAreas = currentFloor === 2 ? FLOOR_AREAS_F2 : FLOOR_AREAS_F1;
    const stairs = currentFloor === 2 ? STAIRS_F2 : STAIRS_F1;
    const rooms = currentFloor === 2 ? ROOMS_F2 : ROOMS_F1;

    // 1. ШАЛ ЗУРАХ
    this.drawFloors(ctx, floorAreas);

    // 2. ТАВИЛГА, ЧИМЭГЛЭЛ
    if (currentFloor === 1) {
      this.drawFurnishingsF1(ctx);
    } else {
      this.drawFurnishingsF2(ctx);
    }

    // 3. ШАТНУУД
    this.drawStairs(ctx, stairs, currentFloor);

    // 4. ИНТЕРАКТИВ ОБЪЕКТУУД (Кофе машин, сандал)
    this.drawInteractiveObjects(ctx, currentFloor);

    // 5. ӨРӨӨНИЙ НЭРС, ШОШГО
    this.drawRoomLabels(ctx, rooms);

    // 6. ХААЛГАНУУД
    this.drawDoors(ctx, wallsData.doors);

    // 7. ХАНАНУУД
    this.drawWalls(ctx, wallsData.segments);

    // 8. POI МАРКЕРУУД
    if (this.showPOIs) {
      this.drawPOIMarkers(ctx, currentFloor);
    }

    // 9. ХАЙЛТЫН ЗААГЧ ГЭРЭЛ (BEACON)
    if (this.targetBeacon && this.beaconTimer > 0) {
      this.beaconTimer -= dt;
      this.drawBeacon(ctx, this.targetBeacon.x, this.targetBeacon.y);
      if (this.beaconTimer <= 0) this.targetBeacon = null;
    }

    // 10. ТОГЛОГЧИД ЗУРАХ (Зөвхөн тухайн давхарт байгаа тоглогчид)
    const allChars = [localPlayer, ...Object.values(otherPlayers)].filter(p => (p.floor || 1) === currentFloor);
    allChars.sort((a, b) => a.y - b.y);
    for (const char of allChars) {
      char.draw(ctx);
    }

    ctx.restore();

    // 11. MINIMAP ЗУРАХ
    this.drawMinimap(ctx, localPlayer, otherPlayers, wallsData, floorAreas, currentFloor);
  }

  // Шал зурах
  drawFloors(ctx, floorAreas) {
    for (const area of floorAreas) {
      const w = area.x2 - area.x1;
      const h = area.y2 - area.y1;

      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(area.x1 - 8, area.y1 - 8, w + 16, h + 16);

      if (area.type === 'corridor_h') {
        ctx.fillStyle = this.corridorHPattern;
      } else if (area.type === 'corridor_v') {
        ctx.fillStyle = this.corridorVPattern;
      } else if (area.type === 'lobby') {
        ctx.fillStyle = '#e8ded0';
      } else {
        ctx.fillStyle = this.tilePattern;
      }
      ctx.fillRect(area.x1, area.y1, w, h);

      ctx.strokeStyle = '#c5ba9f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(area.x1, area.y1, w, h);
    }
  }

  // 1-р давхрын тавилгууд
  drawFurnishingsF1(ctx) {
    this.drawBasketballCourt(ctx, 662 * SCALE, 25 * SCALE, 737 * SCALE, 137 * SCALE);
    this.drawCanteen(ctx, 617 * SCALE, 25 * SCALE, 662 * SCALE, 185 * SCALE);
    this.drawComputerLab(ctx, 485 * SCALE, 447 * SCALE, 583 * SCALE, 515 * SCALE, '110 МТ Лаб');
    this.drawComputerLab(ctx, 137 * SCALE, 655 * SCALE, 208 * SCALE, 800 * SCALE, '125 Лаб');
    this.drawComputerLab(ctx, 137 * SCALE, 800 * SCALE, 208 * SCALE, 905 * SCALE, '127 AI Лаб');
    this.drawComputerLab(ctx, 245 * SCALE, 570 * SCALE, 318 * SCALE, 620 * SCALE, '118 Лаб');
    this.drawComputerLab(ctx, 245 * SCALE, 740 * SCALE, 318 * SCALE, 800 * SCALE, '126 Лаб');
    this.drawComputerLab(ctx, 617 * SCALE, 240 * SCALE, 662 * SCALE, 325 * SCALE, '131 IoT Лаб');

    this.drawLectureHall(ctx, 318 * SCALE, 325 * SCALE, 430 * SCALE, 408 * SCALE, 'north');
    this.drawLectureHall(ctx, 318 * SCALE, 447 * SCALE, 430 * SCALE, 515 * SCALE, 'south');
    this.drawLectureHall(ctx, 137 * SCALE, 420 * SCALE, 208 * SCALE, 540 * SCALE, 'west');

    this.drawDirectorOffice(ctx, 958 * SCALE, 447 * SCALE, 1082 * SCALE, 515 * SCALE);
    this.drawConferenceHall(ctx, 960 * SCALE, 325 * SCALE, 1082 * SCALE, 408 * SCALE);
    this.drawMediaStudio(ctx, 137 * SCALE, 540 * SCALE, 208 * SCALE, 620 * SCALE);
    this.drawLobby(ctx, 630 * SCALE, 455 * SCALE, 690 * SCALE, 585 * SCALE);

    this.drawLounge(ctx, 650 * SCALE, 328 * SCALE, 735 * SCALE, 405 * SCALE);
    this.drawLounge(ctx, 430 * SCALE, 328 * SCALE, 480 * SCALE, 405 * SCALE);
    this.drawLounge(ctx, 245 * SCALE, 360 * SCALE, 318 * SCALE, 470 * SCALE);
  }

  // 2-р давхрын тавилгууд (Номын сан, Тэнхимүүд)
  drawFurnishingsF2(ctx) {
    // 220 Номын сан (Том уншлагын танхим, номын шүүгээнүүд)
    this.drawLibrary(ctx, 900 * SCALE, 325 * SCALE, 1082 * SCALE, 515 * SCALE);

    // 210 Их лаб
    this.drawComputerLab(ctx, 485 * SCALE, 447 * SCALE, 583 * SCALE, 515 * SCALE, '210 Лаб');

    // 213 Их танхим
    this.drawLectureHall(ctx, 318 * SCALE, 325 * SCALE, 430 * SCALE, 408 * SCALE, 'north');

    // 230 Багш нарын хурлын заал
    this.drawConferenceHall(ctx, 650 * SCALE, 325 * SCALE, 735 * SCALE, 408 * SCALE);
  }

  // Номын сан зурах (Floor 2)
  drawLibrary(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.fillStyle = this.libraryPattern;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

    // Номын урт тавиурууд (Bookshelves)
    ctx.fillStyle = '#854d0e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    for (let x = x1 + 40; x < x2 - 50; x += 60) {
      ctx.fillRect(x, y1 + 30, 20, 100);
      ctx.strokeRect(x, y1 + 30, 20, 100);
    }

    // Уншлагын ширээнүүд (ногоон ширээний чийдэнтэй)
    for (let y = y1 + 180; y < y2 - 40; y += 70) {
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x1 + 60, y, 160, 28);
      ctx.strokeRect(x1 + 60, y, 160, 28);
      // Ногоон чийдэн
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x1 + 100, y + 14, 6, 0, Math.PI * 2);
      ctx.arc(x1 + 180, y + 14, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Интерактив объектууд (Кофе аппарат, сандал)
  drawInteractiveObjects(ctx, currentFloor) {
    ctx.save();
    const objs = INTERACTIVE_OBJECTS.filter(o => o.floor === currentFloor);

    for (const obj of objs) {
      if (obj.type === 'coffee_machine') {
        // Кофе аппарат
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(obj.x - 14, obj.y - 18, 28, 36, 6);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Дэлгэц
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(obj.x - 8, obj.y - 12, 16, 8);

        // Цорго & Аяга
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(obj.x - 4, obj.y + 4, 8, 8);

        // Шошго
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('☕ Кофе [E]', obj.x, obj.y - 24);
      } else if (obj.type === 'chair') {
        // Сандал
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 8.5px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Суух [E]', obj.x, obj.y - 14);
      }
    }
    ctx.restore();
  }

  // POI Маркерууд зурах
  drawPOIMarkers(ctx, currentFloor) {
    ctx.save();
    const pois = POI_MARKERS.filter(p => p.floor === currentFloor);

    for (const p of pois) {
      // Бөөрөнхий тэмдэг
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 28, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Эможи
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon, p.x, p.y - 27);
    }
    ctx.restore();
  }

  // Хайлтын заагч цагираг
  drawBeacon(ctx, bx, by) {
    ctx.save();
    const pulse = (performance.now() % 1000) / 1000;
    const r = 20 + pulse * 45;

    ctx.strokeStyle = `rgba(56, 189, 248, ${1 - pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();

    // Голын төв цэг
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Сагсан бөмбөгийн талбай
  drawBasketballCourt(ctx, x1, y1, x2, y2) {
    const w = x2 - x1;
    const h = y2 - y1;
    ctx.save();
    ctx.fillStyle = this.gymPattern;
    ctx.fillRect(x1, y1, w, h);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x1 + 12, y1 + 12, w - 24, h - 24);

    const cx = x1 + w / 2;
    const cy = y1 + h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1 + 12, cy);
    ctx.lineTo(x2 - 12, cy);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 24, y1 + 14, 48, 6);
    ctx.fillRect(cx - 24, y2 - 20, 48, 6);

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, y1 + 28, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y2 - 28, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Цайны газар
  drawCanteen(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(x1 + 12, y1 + 25, 20, y2 - y1 - 50);
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1 + 12, y1 + 25, 20, y2 - y1 - 50);

    for (let y = y1 + 45; y < y2 - 45; y += 70) {
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x1 + 48, y, 38, 26);
      ctx.strokeRect(x1 + 48, y, 38, 26);

      ctx.fillStyle = '#9a3412';
      ctx.fillRect(x1 + 38, y + 4, 7, 18);
      ctx.fillRect(x1 + 89, y + 4, 7, 18);
    }
    ctx.restore();
  }

  // Компьютерийн лаборатори
  drawComputerLab(ctx, x1, y1, x2, y2, title) {
    ctx.save();
    const isVertical = (y2 - y1) > (x2 - x1);

    if (isVertical) {
      for (let y = y1 + 40; y < y2 - 40; y += 65) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x1 + 15, y, 48, 22);
        ctx.strokeRect(x1 + 15, y, 48, 22);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x1 + 25, y + 2, 28, 6);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x2 - 63, y, 48, 22);
        ctx.strokeRect(x2 - 63, y, 48, 22);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x2 - 53, y + 2, 28, 6);
      }
    } else {
      for (let x = x1 + 40; x < x2 - 55; x += 55) {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x, y1 + 25, 40, 32);
        ctx.strokeRect(x, y1 + 25, 40, 32);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x + 5, y1 + 28, 12, 5);
        ctx.fillRect(x + 22, y1 + 28, 12, 5);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x, y2 - 58, 40, 32);
        ctx.strokeRect(x, y2 - 58, 40, 32);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x + 5, y2 - 38, 12, 5);
        ctx.fillRect(x + 22, y2 - 38, 12, 5);
      }
    }
    ctx.restore();
  }

  // Лекцийн танхим
  drawLectureHall(ctx, x1, y1, x2, y2, orientation) {
    ctx.save();
    ctx.fillStyle = '#1e3a1e';
    if (orientation === 'north') {
      ctx.fillRect(x1 + 40, y1 + 10, x2 - x1 - 80, 8);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x1 + (x2 - x1) / 2 - 22, y1 + 28, 44, 20);
    } else if (orientation === 'south') {
      ctx.fillRect(x1 + 40, y2 - 18, x2 - x1 - 80, 8);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x1 + (x2 - x1) / 2 - 22, y2 - 48, 44, 20);
    } else {
      ctx.fillRect(x1 + 10, y1 + 40, 8, y2 - y1 - 80);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x1 + 28, y1 + (y2 - y1) / 2 - 22, 20, 44);
    }

    ctx.fillStyle = '#e2d5c3';
    ctx.strokeStyle = '#9a8368';
    ctx.lineWidth = 1.5;

    if (orientation === 'north') {
      for (let y = y1 + 65; y < y2 - 25; y += 35) {
        ctx.fillRect(x1 + 25, y, x2 - x1 - 50, 16);
        ctx.strokeRect(x1 + 25, y, x2 - x1 - 50, 16);
      }
    } else if (orientation === 'south') {
      for (let y = y1 + 25; y < y2 - 65; y += 35) {
        ctx.fillRect(x1 + 25, y, x2 - x1 - 50, 16);
        ctx.strokeRect(x1 + 25, y, x2 - x1 - 50, 16);
      }
    } else {
      for (let x = x1 + 65; x < x2 - 25; x += 38) {
        ctx.fillRect(x, y1 + 28, 16, y2 - y1 - 56);
        ctx.strokeRect(x, y1 + 28, 16, y2 - y1 - 56);
      }
    }
    ctx.restore();
  }

  // Захирлын өрөө
  drawDirectorOffice(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x1 + 50, y1 + 30, 80, 42);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1 + 50, y1 + 30, 80, 42);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x1 + 90, y1 + 20, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#92400e';
    ctx.fillRect(x1 + 150, y1 + 35, 90, 50);
    ctx.strokeRect(x1 + 150, y1 + 35, 90, 50);

    ctx.fillStyle = '#5c2c16';
    ctx.fillRect(x2 - 22, y1 + 20, 16, y2 - y1 - 40);

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(x1 + 25, y1 + 28, 12, 0, Math.PI * 2);
    ctx.arc(x1 + 25, y2 - 28, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Хурлын танхим
  drawConferenceHall(ctx, x1, y1, x2, y2) {
    ctx.save();
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#422006';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#334155';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const sx = cx + Math.cos(angle) * 105;
      const sy = cy + Math.sin(angle) * 55;
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Студи
  drawMediaStudio(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(x1 + 20, y1 + 25, 20, y2 - y1 - 50);

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(x2 - 50, y1 + (y2 - y1) / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Лобби
  drawLobby(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(x1 + 25, y1 + 40, x2 - x1 - 50, 26, 8);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ШУТИС • МХТС ҮҮД', (x1 + x2) / 2, y1 + 58);
    ctx.restore();
  }

  // Амрах орчин
  drawLounge(ctx, x1, y1, x2, y2) {
    ctx.save();
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(cx - 35, cy - 28, 70, 20, 6);
    ctx.roundRect(cx - 35, cy + 10, 70, 20, 6);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Шатнууд
  drawStairs(ctx, stairs, currentFloor) {
    ctx.save();
    for (const st of stairs) {
      const w = st.x2 - st.x1;
      const h = st.y2 - st.y1;

      ctx.fillStyle = '#d1c7b7';
      ctx.fillRect(st.x1, st.y1, w, h);
      ctx.strokeStyle = '#8c7b68';
      ctx.lineWidth = 2;
      ctx.strokeRect(st.x1, st.y1, w, h);

      const numSteps = 10;
      ctx.strokeStyle = '#5a4a39';
      ctx.lineWidth = 2;
      for (let i = 1; i < numSteps; i++) {
        const y = st.y1 + (h / numSteps) * i;
        ctx.beginPath();
        ctx.moveTo(st.x1, y);
        ctx.lineTo(st.x2, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const arrow = currentFloor === 1 ? '▲ 2-р давхар [E]' : '▼ 1-р давхар [E]';
      ctx.fillText(arrow, st.x1 + w / 2, st.y1 + h / 2 + 5);
    }
    ctx.restore();
  }

  // Өрөөний нэрс
  drawRoomLabels(ctx, rooms) {
    ctx.save();
    for (const r of rooms) {
      const px = r.labelPos.x;
      const py = r.labelPos.y;

      ctx.font = 'bold 12px system-ui, sans-serif';
      const tw = ctx.measureText(r.name).width;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath();
      ctx.roundRect(px - tw / 2 - 7, py - 11, tw + 14, 22, 6);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.name, px, py);
    }
    ctx.restore();
  }

  // Хаалганууд
  drawDoors(ctx, doors) {
    ctx.save();
    for (const d of doors) {
      ctx.fillStyle = '#f5f0e4';
      ctx.fillRect(d.rect.x1, d.rect.y1, d.rect.x2 - d.rect.x1, d.rect.y2 - d.rect.y1);

      ctx.fillStyle = '#4a2e2b';
      if (d.isHoriz) {
        ctx.fillRect(d.rect.x1 - 3, d.y - 7, 5, 14);
        ctx.fillRect(d.rect.x2 - 2, d.y - 7, 5, 14);

        ctx.strokeStyle = '#8a5a44';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(d.rect.x1, d.y);
        ctx.lineTo(d.rect.x1 + d.width * 0.7, d.y - d.width * 0.6);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(138, 90, 68, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(d.rect.x1, d.y, d.width * 0.88, -Math.PI * 0.35, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillRect(d.x - 7, d.rect.y1 - 3, 14, 5);
        ctx.fillRect(d.x - 7, d.rect.y2 - 2, 14, 5);

        ctx.strokeStyle = '#8a5a44';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(d.x, d.rect.y1);
        ctx.lineTo(d.x - d.width * 0.6, d.rect.y1 + d.width * 0.7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Хананууд
  drawWalls(ctx, segments) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (const seg of segments) {
      const isHoriz = seg.y1 === seg.y2;
      if (isHoriz) {
        ctx.fillRect(seg.x1 + 4, seg.y1 + 2, seg.x2 - seg.x1, 7);
      } else {
        ctx.fillRect(seg.x1 + 2, seg.y1 + 4, 7, seg.y2 - seg.y1);
      }
    }

    ctx.strokeStyle = '#2d241f';
    ctx.lineWidth = 8;
    ctx.lineCap = 'square';
    ctx.beginPath();
    for (const seg of segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();

    ctx.strokeStyle = '#8b796d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const seg of segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Minimap (Радар)
  drawMinimap(ctx, localPlayer, otherPlayers, wallsData, floorAreas, currentFloor) {
    const size = 190;
    const padding = 16;
    const x = ctx.canvas.width - size - padding;
    const y = 50;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`МХТС • ${currentFloor}-Р ДАВХАР`, x + 12, y + 17);

    const worldW = 980 * SCALE;
    const worldH = 920 * SCALE;
    const scale = (size - 35) / Math.max(worldW, worldH);
    const ox = x + 12 - (137 * SCALE) * scale;
    const oy = y + 26 - (25 * SCALE) * scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 6, y + 22, size - 12, size - 28);
    ctx.clip();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (const area of floorAreas) {
      ctx.fillRect(
        ox + area.x1 * scale,
        oy + area.y1 * scale,
        (area.x2 - area.x1) * scale,
        (area.y2 - area.y1) * scale
      );
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const seg of wallsData.segments) {
      ctx.moveTo(ox + seg.x1 * scale, oy + seg.y1 * scale);
      ctx.lineTo(ox + seg.x2 * scale, oy + seg.y2 * scale);
    }
    ctx.stroke();

    for (const op of Object.values(otherPlayers)) {
      if ((op.floor || 1) === currentFloor) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(ox + op.x * scale, oy + op.y * scale, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(ox + localPlayer.x * scale, oy + localPlayer.y * scale, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}
