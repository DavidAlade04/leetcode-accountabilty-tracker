importScripts("compliments.js");

const STORAGE_KEYS = {
  discordWebhookUrl: "discordWebhookUrl",
  leetcodeUsername: "leetcodeUsername",
  includeProblemDetails: "includeProblemDetails",
  lastNotificationDate: "lastLeetCodeNotificationDate",
  currentStreak: "currentLeetCodeStreak"
};
const notificationDatesInFlight = new Set();

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.url;

  if (changeInfo.status !== "complete" || !isLeetCodeUrl(url)) {
    return;
  }

  notifyOncePerDay(url).catch((error) => {
    console.error("LeetCode accountability notification failed:", error);
  });
});

function isLeetCodeUrl(url) {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).hostname === "leetcode.com";
  } catch {
    return false;
  }
}

async function notifyOncePerDay(url) {
  const settings = await getSettings();

  if (!isConfigured(settings)) {
    console.warn("LeetCode accountability settings are not configured.");
    return;
  }

  const now = new Date();
  const today = getLocalDateKey(now);
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.lastNotificationDate,
    STORAGE_KEYS.currentStreak
  ]);

  if (
    stored[STORAGE_KEYS.lastNotificationDate] === today ||
    notificationDatesInFlight.has(today)
  ) {
    return;
  }

  notificationDatesInFlight.add(today);

  try {
    const nextStreak = getNextStreak(
      stored[STORAGE_KEYS.lastNotificationDate],
      Number(stored[STORAGE_KEYS.currentStreak] || 0),
      now
    );

    await sendDiscordNotification({
      date: now,
      problem: await getProblemForNotification(url, settings),
      streak: nextStreak,
      settings
    });

    await chrome.storage.local.set({
      [STORAGE_KEYS.lastNotificationDate]: today,
      [STORAGE_KEYS.currentStreak]: nextStreak
    });
  } finally {
    notificationDatesInFlight.delete(today);
  }
}

async function getSettings() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.discordWebhookUrl,
    STORAGE_KEYS.leetcodeUsername,
    STORAGE_KEYS.includeProblemDetails
  ]);

  return {
    discordWebhookUrl: String(stored[STORAGE_KEYS.discordWebhookUrl] || "").trim(),
    leetcodeUsername: String(stored[STORAGE_KEYS.leetcodeUsername] || "").trim(),
    includeProblemDetails: stored[STORAGE_KEYS.includeProblemDetails] === true
  };
}

function isConfigured(settings) {
  return (
    settings.discordWebhookUrl.startsWith("https://discord.com/api/webhooks/") &&
    settings.leetcodeUsername.length > 0
  );
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextStreak(lastNotificationDate, currentStreak, today) {
  if (!lastNotificationDate) {
    return 1;
  }

  return isYesterday(lastNotificationDate, today) ? currentStreak + 1 : 1;
}

function isYesterday(dateKey, today) {
  return dateKey === getLocalDateKey(addDays(today, -1));
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatFriendlyDate(date) {
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const day = date.getDate();

  return `${weekdays[date.getDay()]} ${day}${getOrdinalSuffix(day)} ${months[date.getMonth()]}`;
}

function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function getRandomCompliment() {
  const compliments = Array.isArray(self.DAILY_COMPLIMENTS)
    ? self.DAILY_COMPLIMENTS.filter(Boolean)
    : [];

  if (compliments.length === 0) {
    return "Nice work showing up today.";
  }

  return compliments[Math.floor(Math.random() * compliments.length)];
}

async function getProblemForNotification(url, settings) {
  if (!settings.includeProblemDetails) {
    return null;
  }

  const titleSlug = getProblemTitleSlug(url);

  if (!titleSlug) {
    return null;
  }

  try {
    return await fetchProblemDetails(titleSlug);
  } catch (error) {
    console.warn("Could not fetch LeetCode problem details:", error);
    return {
      title: titleFromSlug(titleSlug),
      difficulty: ""
    };
  }
}

function getProblemTitleSlug(url) {
  try {
    const { pathname } = new URL(url);
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts[0] !== "problems" || !pathParts[1]) {
      return null;
    }

    return pathParts[1];
  } catch {
    return null;
  }
}

async function fetchProblemDetails(titleSlug) {
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: `
        query getQuestionDetails($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            title
            difficulty
          }
        }
      `,
      variables: { titleSlug }
    })
  });

  if (!response.ok) {
    throw new Error(`LeetCode API returned ${response.status}`);
  }

  const payload = await response.json();
  const question = payload && payload.data && payload.data.question;

  if (!question || !question.title) {
    throw new Error("LeetCode API did not return a question.");
  }

  return {
    title: question.title,
    difficulty: question.difficulty || ""
  };
}

function titleFromSlug(titleSlug) {
  return titleSlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function sendDiscordNotification({ date, problem, streak, settings }) {
  const friendlyDate = formatFriendlyDate(date);
  const streakLabel = streak === 1 ? "1 day" : `${streak} days`;
  const problemText = formatProblemText(problem);

  const response = await fetch(settings.discordWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: `${settings.leetcodeUsername} opened LeetCode on ${friendlyDate}. Current streak: ${streakLabel}.${problemText} ${getRandomCompliment()}`
    })
  });

  if (!response.ok) {
    throw new Error(`Discord webhook returned ${response.status}`);
  }
}

function formatProblemText(problem) {
  if (!problem) {
    return "";
  }

  const difficulty = problem.difficulty ? ` (${problem.difficulty})` : "";

  return ` Question: ${problem.title}${difficulty}.`;
}
