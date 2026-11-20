const container = document.createElement('div');
container.id = 'presentation-pet-container';
container.style.setProperty('display', 'none', 'important');

// 正式提醒對話框
const bubble = document.createElement('div');
bubble.id = 'pet-speech-bubble';

const messageDiv = document.createElement('div');
messageDiv.id = 'pet-message';

const msgTitle = document.createElement('div');
msgTitle.style.fontWeight = 'bold';
msgTitle.style.fontSize = '15px';

const msgHint = document.createElement('div');
msgHint.style.fontSize = '12px';
msgHint.style.color = '#777';
msgHint.style.marginTop = '4px';

messageDiv.appendChild(msgTitle);
messageDiv.appendChild(msgHint);

const actionBtn = document.createElement('button');
actionBtn.className = 'pet-btn';
actionBtn.id = 'pet-action-btn';
actionBtn.textContent = '餵食';

bubble.appendChild(messageDiv);
bubble.appendChild(actionBtn);

// 互動時的迷你氣泡
const reactionToast = document.createElement('div');
reactionToast.id = 'pet-reaction-toast';

const pet = document.createElement('div');
pet.id = 'presentation-pet';

container.appendChild(bubble);
container.appendChild(reactionToast);
container.appendChild(pet);
document.body.appendChild(container);

let currentPetType = 'cat';
let currentSlotToAck = 0;
let toastTimeout = null;
let wiggleTimeout = null;

// 正式提醒對話庫
const petDialogs = {
  cat: [
    { text: "喵～時間到囉！", hint: "偷瞄一下老師或學員們的表情和反應吧！", btn: "逗貓咪玩 🧶" },
    { text: "喵嗚～我肚子餓了！", hint: "確認一下老師或學員有沒有想發問喔～", btn: "餵貓零食 🐟" }
  ],
  fish: [
    { text: "啵啵啵…時間到囉！", hint: "偷偷確認一下老師或學員的聽講狀況吧！", btn: "灑魚飼料 🫧" },
    { text: "游來游去～該餵我吃飯了！", hint: "順便看看老師或學員有沒有困惑喔～", btn: "灑魚飼料 🫧" }
  ],
  groundhog: [
    { text: "啊啊啊！時間到啦！", hint: "老師和學員們還醒著嗎？快確認一下！", btn: "給牠瓜子 🌻" },
    { text: "探頭探腦...", hint: "氣氛有點乾？試著和老師或學員互動吧！", btn: "摸摸土撥鼠 🐹" }
  ],
  sloth: [
    { text: "哈欠～時間到囉…", hint: "放慢腳步，確認一下老師或學員的反應吧！", btn: "餵樹懶吃樹葉 🌿" },
    { text: "抱緊樹枝…", hint: "確認一下老師或學員有沒有跟上進度喔～", btn: "摸摸慢樹懶 🦥" }
  ]
};

// 互動台詞與特效
const petReactions = {
  cat: {
    pat: ["呼嚕呼嚕～好舒服 😻", "蹭蹭你的手心 💕", "喵嗚～最喜歡你了 ✨"],
    eat: "啊姆啊姆！小魚乾好好吃 🐟💕",
    snack: "🐟",
    particles: ["❤️", "💕", "✨", "🐾"]
  },
  fish: {
    pat: [], // 魚缸隔著玻璃不觸發摸摸
    eat: "灑了魚飼料，小魚游過來吃囉 🫧",
    snack: "🔸",
    particles: ["🫧", "🫧", "✨", "💙"]
  },
  groundhog: {
    pat: ["爽到瞇起眼睛！💕", "開心到扭扭屁股 🎵", "發出幸福的小叫聲 ✨"],
    eat: "咔滋咔滋！瓜子太讚啦 🌻💕",
    snack: "🌻",
    particles: ["❤️", "✨", "🎵", "💛"]
  },
  sloth: {
    pat: ["慢～慢～地～露出微笑 🌿", "抱緊樹枝看著你 💕", "好放鬆喔…呼呼 ✨"],
    eat: "嚼…嚼…嫩葉子真香 🌿💕",
    snack: "🌿",
    particles: ["💚", "🌿", "✨", "💤"]
  }
};

function applyMode(mode) {
  if (mode === 'off') {
    container.style.setProperty('display', 'none', 'important');
    bubble.style.display = 'none';
  } else if (mode === 'accompany') {
    container.style.setProperty('display', 'flex', 'important');
    bubble.style.display = 'none';
  } else {
    container.style.setProperty('display', 'flex', 'important');
  }
}

function showEmojiFallback(type) {
  const span = document.createElement('span');
  span.className = 'pet-emoji';
  const emojiMap = { fish: '🐠', groundhog: '🐹', sloth: '🦥', cat: '🐱' };
  span.textContent = emojiMap[type] || '🐱';
  pet.replaceChildren(span);
}

function renderPetVisual(type) {
  currentPetType = type;

  // 樹懶掛在樹枝上維持靜止，其他小動物才加上微微上下飄浮
  if (type === 'sloth') {
    pet.classList.remove('pet-floating');
  } else {
    pet.classList.add('pet-floating');
  }

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL(`${type}.png`);
  img.draggable = false;

  img.onerror = () => {
    const gif = document.createElement('img');
    gif.src = chrome.runtime.getURL(`${type}.gif`);
    gif.draggable = false;
    gif.onerror = () => {
      showEmojiFallback(type);
    };
    pet.replaceChildren(gif);
  };

  pet.replaceChildren(img);
}

// --- 互動特效函式 ---
function triggerWiggle() {
  pet.classList.remove('pet-happy', 'pet-sway');
  void pet.offsetWidth; // 重新觸發動畫

  if (currentPetType === 'sloth') {
    pet.classList.add('pet-sway'); // 樹懶只微微晃動樹枝
  } else {
    pet.classList.add('pet-happy');
  }

  clearTimeout(wiggleTimeout);
  wiggleTimeout = setTimeout(() => {
    pet.classList.remove('pet-happy', 'pet-sway');
  }, 850);
}

function showReactionToast(text) {
  reactionToast.textContent = text;
  reactionToast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    reactionToast.classList.remove('show');
  }, 2000);
}

function spawnParticles(count = 3) {
  const rect = pet.getBoundingClientRect();
  const data = petReactions[currentPetType] || petReactions.cat;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'pet-particle';
    p.textContent = data.particles[Math.floor(Math.random() * data.particles.length)];
    const randomX = rect.left + rect.width * (0.2 + Math.random() * 0.6);
    const randomY = rect.top + rect.height * (0.1 + Math.random() * 0.4);
    p.style.left = `${randomX}px`;
    p.style.top = `${randomY}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

function dropSnack() {
  const rect = pet.getBoundingClientRect();
  const data = petReactions[currentPetType] || petReactions.cat;

  // 魚缸專屬：從上方灑下 5 顆魚飼料緩緩沉入水中
  if (currentPetType === 'fish') {
    showReactionToast(data.eat);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const pellet = document.createElement('div');
        pellet.className = 'pet-fish-food';
        pellet.textContent = i % 2 === 0 ? '🔸' : '🟤';
        const spreadX = rect.left + rect.width * (0.25 + Math.random() * 0.5);
        const startY = rect.top + rect.height * 0.15;
        pellet.style.left = `${spreadX}px`;
        pellet.style.top = `${startY}px`;
        document.body.appendChild(pellet);
        setTimeout(() => pellet.remove(), 1100);
      }, i * 110);
    }
    setTimeout(() => {
      spawnParticles(3);
    }, 650);
    return;
  }

  // 其他動物：投餵專屬零食
  const snack = document.createElement('div');
  snack.className = 'pet-snack-particle';
  snack.textContent = data.snack;
  snack.style.left = `${rect.left + rect.width / 2 - 13}px`;
  snack.style.top = `${rect.top + rect.height / 2 - 13}px`;
  document.body.appendChild(snack);

  setTimeout(() => {
    snack.remove();
    triggerWiggle();
    spawnParticles(4);
    showReactionToast(data.eat);
  }, 750);
}

// 顯示正式提醒對話框
function showReminder(slot) {
  currentSlotToAck = slot;
  const list = petDialogs[currentPetType] || petDialogs.cat;
  const item = list[Math.floor(Math.random() * list.length)];

  msgTitle.textContent = item.text;
  msgHint.textContent = `(${item.hint})`;
  actionBtn.textContent = item.btn;
  bubble.style.display = 'block';
}

// --- 滑鼠自由拖曳 + 來回撫摸功能 ---
let isDragging = false;
let hasMoved = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let rubDistance = 0;
let lastRubTime = 0;

pet.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  hasMoved = false;
  const rect = container.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  e.preventDefault();
});

// 滑鼠在寵物身上來回移動時觸發「摸摸」（魚缸隔著玻璃不觸發）
pet.addEventListener('mousemove', (e) => {
  if (isDragging || currentPetType === 'fish') return;
  rubDistance += Math.abs(e.movementX) + Math.abs(e.movementY);
  if (rubDistance > 160) {
    rubDistance = 0;
    triggerWiggle();
    spawnParticles(2);

    const now = Date.now();
    if (now - lastRubTime > 2200) {
      lastRubTime = now;
      const data = petReactions[currentPetType] || petReactions.cat;
      const msg = data.pat[Math.floor(Math.random() * data.pat.length)];
      showReactionToast(msg);
    }
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  hasMoved = true;
  const rect = container.getBoundingClientRect();
  let newLeft = e.clientX - dragOffsetX;
  let newTop = e.clientY - dragOffsetY;

  newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, newLeft));
  newTop = Math.max(0, Math.min(window.innerHeight - rect.height, newTop));

  container.style.left = `${newLeft}px`;
  container.style.top = `${newTop}px`;
  container.style.right = 'auto';
  container.style.bottom = 'auto';
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  if (hasMoved) {
    chrome.storage.local.set({
      petPos: {
        left: container.style.left,
        top: container.style.top
      }
    });
  }
});

// 單擊互動：魚缸直接灑飼料，其他動物則為拍拍頭
pet.addEventListener('click', () => {
  if (hasMoved) return;

  if (currentPetType === 'fish') {
    dropSnack();
    return;
  }

  triggerWiggle();
  spawnParticles(3);
  const data = petReactions[currentPetType] || petReactions.cat;
  const msg = data.pat[Math.floor(Math.random() * data.pat.length)];
  showReactionToast(msg);
});

// 連點兩下：投餵零食（魚缸以外的動物適用）
pet.addEventListener('dblclick', (e) => {
  e.preventDefault();
  if (currentPetType !== 'fish') {
    dropSnack();
  }
});

actionBtn.addEventListener('click', () => {
  bubble.style.display = 'none';
  dropSnack();
  if (currentSlotToAck > 0) {
    chrome.storage.local.set({ lastRemindedSlot: currentSlotToAck });
  }
});

function applySavedPosition(petPos) {
  if (petPos && petPos.left && petPos.top && !isDragging) {
    container.style.left = petPos.left;
    container.style.top = petPos.top;
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  }
}

// 監聽跨分頁的模式、位置與寵物變更
chrome.storage.onChanged.addListener((changes) => {
  if (changes.petMode) {
    applyMode(changes.petMode.newValue);
  }
  if (changes.petPos) {
    applySavedPosition(changes.petPos.newValue);
  }
  if (changes.petType) {
    renderPetVisual(changes.petType.newValue);
  }
});

// 每 3 秒比對一次電腦系統時間
const checkTimer = setInterval(() => {
  try {
    chrome.storage.local.get(['petMode', 'petType', 'startTime', 'intervalMins', 'lastRemindedSlot'], (data) => {
      const mode = data.petMode || 'accompany';
      applyMode(mode);

      if (mode !== 'remind') return;

      const type = data.petType || 'cat';
      if (type !== currentPetType) renderPetVisual(type);

      if (!data.startTime) return;

      const intervalMins = data.intervalMins || 25;
      const lastRemindedSlot = data.lastRemindedSlot || 0;

      const [hours, minutes] = data.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const elapsedMs = now - startDate;

      if (elapsedMs > 0) {
        const currentSlot = Math.floor(elapsedMs / (intervalMins * 60 * 1000));
        if (currentSlot >= 1 && currentSlot > lastRemindedSlot) {
          showReminder(currentSlot);
        } else if (currentSlot <= lastRemindedSlot) {
          bubble.style.display = 'none';
        }
      }
    });
  } catch (e) {
    clearInterval(checkTimer);
  }
}, 3000);

// 初始化外觀、位置與模式
chrome.storage.local.get(['petMode', 'petType', 'petPos'], (data) => {
  applyMode(data.petMode || 'accompany');
  renderPetVisual(data.petType || 'cat');
  applySavedPosition(data.petPos);
});