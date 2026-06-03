document.addEventListener('DOMContentLoaded', async () => {
  const streakValue = document.getElementById('streakValue');
  const todayStatus = document.getElementById('todayStatus');
  
  // Storage keys to match background.js
  const STORAGE_KEYS = {
    lastNotificationDate: "lastLeetCodeNotificationDate",
    currentStreak: "currentLeetCodeStreak"
  };

  function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Load state
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.lastNotificationDate,
    STORAGE_KEYS.currentStreak
  ]);

  const streak = Number(stored[STORAGE_KEYS.currentStreak] || 0);
  const lastDate = stored[STORAGE_KEYS.lastNotificationDate];
  const today = getLocalDateKey(new Date());

  // Update UI
  streakValue.textContent = streak === 1 ? '1 Day' : `${streak} Days`;

  if (lastDate === today) {
    todayStatus.textContent = 'Solved! 🎉';
    todayStatus.className = 'status-value solved';
  } else {
    todayStatus.textContent = 'Pending...';
    todayStatus.className = 'status-value pending';
  }

  // Event Listeners
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('dailyChallengeBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://leetcode.com/problemset/all/' });
  });
});
