const modeBtns = document.querySelectorAll('.mode-btn');
const petSelectSection = document.getElementById('petSelectSection');
const timerSettings = document.getElementById('timerSettings');
const petTypeInput = document.getElementById('petType');
const startTimeInput = document.getElementById('startTime');
const intervalInput = document.getElementById('intervalMins');
const saveBtn = document.getElementById('saveBtn');
const statusDiv = document.getElementById('status');

function updateUIByMode(mode) {
  modeBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // 只有在「簡報提醒模式」才顯示時間設定區塊；休息模式時連選寵物區塊一併收起
  petSelectSection.style.display = (mode === 'off') ? 'none' : 'block';
  timerSettings.style.display = (mode === 'remind') ? 'block' : 'none';
}

// 讀取目前儲存的設定
chrome.storage.local.get(['petMode', 'petType', 'startTime', 'intervalMins'], (data) => {
  const currentMode = data.petMode || 'accompany';
  updateUIByMode(currentMode);

  if (data.petType) petTypeInput.value = data.petType;
  if (data.intervalMins) intervalInput.value = data.intervalMins;
  
  if (data.startTime) {
    startTimeInput.value = data.startTime;
  } else {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    startTimeInput.value = `${hh}:${mm}`;
  }
});

// 點擊切換三種模式
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedMode = btn.dataset.mode;
    updateUIByMode(selectedMode);

    chrome.storage.local.set({ petMode: selectedMode }, () => {
      statusDiv.style.color = '#2b9348';
      if (selectedMode === 'accompany') {
        statusDiv.textContent = '已切換為純陪伴模式（不會彈出提醒）🐾';
      } else if (selectedMode === 'remind') {
        statusDiv.textContent = '請確認下方時間後按「開始計時」⏰';
      } else {
        statusDiv.style.color = '#888';
        statusDiv.textContent = '小寵物已隱藏去休息囉 💤';
      }
    });
  });
});

// 切換下拉選單時立刻變身
petTypeInput.addEventListener('change', () => {
  chrome.storage.local.set({ petType: petTypeInput.value });
});

// 按下儲存按鈕（啟動簡報提醒計時）
saveBtn.addEventListener('click', () => {
  const petType = petTypeInput.value;
  const startTime = startTimeInput.value;
  const intervalMins = parseInt(intervalInput.value, 10) || 25;

  if (!startTime) {
    statusDiv.style.color = 'red';
    statusDiv.textContent = '請選擇簡報開始時間！';
    return;
  }

  updateUIByMode('remind');

  chrome.storage.local.set({
    petMode: 'remind',
    petType,
    startTime,
    intervalMins,
    lastRemindedSlot: 0
  }, () => {
    const [h, m] = startTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m + intervalMins, 0, 0);
    const targetStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;

    statusDiv.style.color = '#2b9348';
    statusDiv.textContent = `提醒已啟動！將在 ${targetStr} 提醒你 ✨`;
  });
});