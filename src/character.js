// 2D Тоглогч / Оюутны дүрийг зурах, хөдөлгөөний анимаци хийх модуль

export class Character {
  constructor(config = {}) {
    this.id = config.id || 'player';
    this.studentCode = config.studentCode || 'GUEST';
    this.name = config.name || 'Оюутан';
    this.role = config.role || 'student'; // 'student', 'teacher', 'admin'
    this.status = config.status || 'campus'; // 'campus', 'studying', 'busy', 'home'
    this.floor = config.floor || 1;
    this.x = config.x || 1650;
    this.y = config.y || 1387;
    this.targetX = this.x;
    this.targetY = this.y;
    this.radius = 12;
    this.speed = 215;
    this.dir = config.dir || 'down';
    this.moving = false;
    this.color = config.color || this.getRandomColor();
    this.hairColor = config.hairColor || '#2c1e1a';
    this.skinColor = '#f5cba7';
    this.isLocal = !!config.isLocal;

    // Интерактив төлөвүүд
    this.isSitting = !!config.isSitting;
    this.hasCoffee = !!config.hasCoffee;

    // Анимацийн хувьсагчууд
    this.walkCycle = 0;
    this.chatMessage = '';
    this.chatTimer = 0;
    this.floatingEmote = '';
    this.emoteTimer = 0;
  }

  getRandomColor() {
    const colors = [
      '#2563eb', '#3b82f6', '#059669', '#10b981',
      '#dc2626', '#ef4444', '#7c3aed', '#8b5cf6',
      '#d97706', '#f59e0b', '#0891b2', '#06b6d4'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  say(text) {
    this.chatMessage = text;
    this.chatTimer = 5.0;
  }

  showEmote(emote) {
    this.floatingEmote = emote;
    this.emoteTimer = 3.5;
  }

  update(dt) {
    if (this.chatTimer > 0) {
      this.chatTimer -= dt;
      if (this.chatTimer <= 0) this.chatMessage = '';
    }

    if (this.emoteTimer > 0) {
      this.emoteTimer -= dt;
      if (this.emoteTimer <= 0) this.floatingEmote = '';
    }

    if (!this.isLocal) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      this.x += dx * 0.25;
      this.y += dy * 0.25;
      if (Math.hypot(dx, dy) > 0.5) {
        this.walkCycle += dt * 10;
      }
    } else if (this.moving) {
      this.walkCycle += dt * 10;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Сүүдэр
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 5, this.radius * 1.15, this.radius * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    const step = Math.sin(this.walkCycle) * 3.5;
    const isMoving = this.moving || (!this.isLocal && Math.hypot(this.targetX - this.x, this.targetY - this.y) > 0.5);

    // 2. Хөл (хэрэв сууж байгаа бол нуугдана)
    if (!this.isSitting) {
      ctx.fillStyle = '#2b2b2b';
      if (this.dir === 'left' || this.dir === 'right') {
        const footOff = isMoving ? step : 0;
        ctx.beginPath();
        ctx.ellipse(-footOff, 8, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const leftFootY = 8 + (isMoving ? step : 0);
        const rightFootY = 8 - (isMoving ? step : 0);
        ctx.beginPath();
        ctx.ellipse(-6, leftFootY, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(6, rightFootY, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Их бие (Хувцас/Цамц)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 1, this.radius * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Зах
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 4. Гар
    ctx.fillStyle = this.skinColor;
    if (this.dir === 'down' || this.dir === 'up') {
      const armOff = isMoving ? step * 0.8 : 0;
      ctx.beginPath();
      ctx.arc(-9, 1 - armOff, 3.2, 0, Math.PI * 2);
      ctx.arc(9, 1 + armOff, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Кофены аяга (хэрэв кофе авсан бол гартаа барина)
    if (this.hasCoffee) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, -2, 6, 8);
      ctx.fillStyle = '#78350f'; // Халуун кофе
      ctx.fillRect(9, -1, 4, 2);
      // Уур
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, -3);
      ctx.lineTo(12, -7);
      ctx.stroke();
    }

    // 6. Толгой
    ctx.fillStyle = this.skinColor;
    ctx.beginPath();
    ctx.arc(0, -3.5, this.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // 7. Үс
    ctx.fillStyle = this.hairColor;
    ctx.beginPath();
    if (this.dir === 'up') {
      ctx.arc(0, -4, this.radius * 0.72, 0, Math.PI * 2);
    } else if (this.dir === 'down') {
      ctx.arc(0, -5, this.radius * 0.68, Math.PI * 0.8, Math.PI * 2.2);
    } else if (this.dir === 'left') {
      ctx.arc(2, -4.5, this.radius * 0.68, Math.PI * 0.4, Math.PI * 1.8);
    } else if (this.dir === 'right') {
      ctx.arc(-2, -4.5, this.radius * 0.68, -Math.PI * 0.8, Math.PI * 0.6);
    }
    ctx.fill();

    // 8. Нүд
    if (this.dir !== 'up') {
      ctx.fillStyle = '#1e293b';
      let e1x = -3, e1y = -3.5, e2x = 3, e2y = -3.5;
      if (this.dir === 'down') {
        e1y = -2.5; e2y = -2.5;
      } else if (this.dir === 'left') {
        e1x = -5; e1y = -3; e2x = -2; e2y = -3;
      } else if (this.dir === 'right') {
        e1x = 2; e1y = -3; e2x = 5; e2y = -3;
      }
      ctx.beginPath();
      ctx.arc(e1x, e1y, 1.4, 0, Math.PI * 2);
      ctx.arc(e2x, e2y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Толгойн дээрх нэрийн шошго & Эрхийн тэмдэг
    this.drawNameTag(ctx);

    // 10. Хөвөгч Эможи (Emote)
    if (this.floatingEmote) {
      this.drawEmote(ctx, this.floatingEmote);
    }

    // 11. Чатны ярианы хөөс
    if (this.chatMessage) {
      this.drawSpeechBubble(ctx, this.chatMessage);
    }

    ctx.restore();
  }

  drawNameTag(ctx) {
    let roleBadge = '';
    let roleColor = '#38bdf8';
    if (this.role === 'admin') {
      roleBadge = '👑 ';
      roleColor = '#ef4444';
    } else if (this.role === 'teacher') {
      roleBadge = '🎓 ';
      roleColor = '#f59e0b';
    }

    const text = `${roleBadge}${this.name}${this.isLocal ? ' (Та)' : ''}`;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 8;
    const height = 20;
    const y = -28;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - paddingX, y - height / 2, textWidth + paddingX * 2, height, 10);
    ctx.fill();

    ctx.strokeStyle = roleColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = roleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, y);
  }

  drawEmote(ctx, emote) {
    const y = -58;
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillText(emote, 0, y + 1);
  }

  drawSpeechBubble(ctx, text) {
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    const maxWidth = 200;

    const words = text.split(' ');
    const lines = [];
    let curLine = '';
    for (const w of words) {
      const testLine = curLine ? `${curLine} ${w}` : w;
      if (ctx.measureText(testLine).width > maxWidth && curLine) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = testLine;
      }
    }
    if (curLine) lines.push(curLine);

    const lineHeight = 17;
    const bubbleWidth = Math.min(maxWidth + 18, Math.max(...lines.map(l => ctx.measureText(l).width)) + 18);
    const bubbleHeight = lines.length * lineHeight + 14;
    const bubbleY = -52 - bubbleHeight;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-bubbleWidth / 2, bubbleY, bubbleWidth, bubbleHeight, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-6, bubbleY + bubbleHeight);
    ctx.lineTo(0, bubbleY + bubbleHeight + 7);
    ctx.lineTo(6, bubbleY + bubbleHeight);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const ly = bubbleY + 9 + i * lineHeight + lineHeight / 2;
      ctx.fillText(l, 0, ly);
    });
  }
}
