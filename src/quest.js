// ШУТИС МХТС Шинэ Оюутны Аялал (Campus Quest & Gamification Engine)
import { sound } from './audio.js';

export const QUEST_STEPS = [
  {
    id: 'quest_lobby',
    title: '1. Сургуульд хүрэлцэн ирэх',
    desc: 'МХТС-ийн төв үүдний танхимтай (Лобби) танилцана уу.',
    targetRoom: 'lobby',
    reward: '10 EXP'
  },
  {
    id: 'quest_lab',
    title: '2. 110 МТ Компьютерийн Лаборатори',
    desc: 'Програмчлалын 110 лаб руу алхан орж компьютеруудтай танилц.',
    targetRoom: 'r110',
    reward: '25 EXP'
  },
  {
    id: 'quest_coffee',
    title: '3. Цайны газар эсвэл Кофе авах',
    desc: 'Цайны газар луу очих эсвэл кофе машин дээр очиж [E] дарна уу.',
    targetRoom: 'canteen_main',
    reward: '20 EXP'
  },
  {
    id: 'quest_gym',
    title: '4. 135 Спорт заал руу гүйх',
    desc: 'Shift товч дарж гүйгээд сагсан бөмбөгийн 135 заал руу орно уу.',
    targetRoom: 'gym',
    reward: '30 EXP'
  },
  {
    id: 'quest_director',
    title: '5. 102 Захирлын өрөөнд зочлох',
    desc: '102 Захирлын албан өрөөнд очсоноор сургуулийн аялал дуусна!',
    targetRoom: 'r102',
    reward: '🎓 ШУТИС МХТС Батламж'
  }
];

export class QuestManager {
  constructor() {
    this.currentStep = Number(localStorage.getItem('sict_quest_step') || 0);
    this.isCompleted = localStorage.getItem('sict_quest_completed') === 'true';
    this.onUpdateCallback = null;
  }

  onUpdate(cb) {
    this.onUpdateCallback = cb;
  }

  getCurrentQuest() {
    if (this.isCompleted || this.currentStep >= QUEST_STEPS.length) {
      return null;
    }
    return QUEST_STEPS[this.currentStep];
  }

  checkLocation(roomId, playerHasCoffee = false) {
    if (this.isCompleted || this.currentStep >= QUEST_STEPS.length) return;

    const quest = QUEST_STEPS[this.currentStep];
    let stepDone = false;

    if (quest.id === 'quest_coffee') {
      if (roomId === 'canteen_main' || playerHasCoffee) {
        stepDone = true;
      }
    } else if (roomId === quest.targetRoom) {
      stepDone = true;
    }

    if (stepDone) {
      this.currentStep++;
      localStorage.setItem('sict_quest_step', this.currentStep);
      sound.playQuestComplete();

      if (this.currentStep >= QUEST_STEPS.length) {
        this.isCompleted = true;
        localStorage.setItem('sict_quest_completed', 'true');
        this.triggerVictoryPopup();
      }

      if (this.onUpdateCallback) this.onUpdateCallback();
    }
  }

  triggerVictoryPopup() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
      <div class="modal-content interactive" style="border: 2px solid #38bdf8; text-align: center;">
        <div style="font-size: 42px; margin-bottom: 8px;">🎓🏆</div>
        <h2 style="color: #38bdf8; font-size: 20px; margin-bottom: 8px;">БАЯР ХҮРГЭЕ!</h2>
        <p style="color: #cbd5e1; font-size: 13.5px; line-height: 1.5; margin-bottom: 16px;">
          Та ШУТИС - Мэдээлэл, Холбооны Технологийн Сургуулийн 1-р давхрын бүх чухал танхим, лабораторитой бүрэн танилцаж дууслаа!
        </p>
        <div style="background: rgba(56, 189, 248, 0.15); border: 1px dashed #38bdf8; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
          <div style="color: #f1f5f9; font-weight: bold; font-size: 14px;">Шагнал гардуулав:</div>
          <div style="color: #38bdf8; font-weight: 600; font-size: 13px;">📜 МХТС-ийн Цахим Аялагч Оюутны Батламж</div>
        </div>
        <button id="btn-close-victory" class="enter-btn">Аяллаа үргэлжлүүлэх 🚀</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#btn-close-victory').addEventListener('click', () => {
      modal.remove();
    });
  }
}

export const questManager = new QuestManager();
