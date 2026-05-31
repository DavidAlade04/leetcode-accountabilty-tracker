const STORAGE_KEYS = {
  discordWebhookUrl: "discordWebhookUrl",
  leetcodeUsername: "leetcodeUsername",
  includeProblemDetails: "includeProblemDetails"
};

const form = document.querySelector("#settings-form");
const usernameInput = document.querySelector("#leetcode-username");
const webhookInput = document.querySelector("#discord-webhook-url");
const includeProblemDetailsInput = document.querySelector("#include-problem-details");
const statusMessage = document.querySelector("#status-message");

loadSettings();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const discordWebhookUrl = webhookInput.value.trim();
  const leetcodeUsername = usernameInput.value.trim();
  const includeProblemDetails = includeProblemDetailsInput.checked;

  if (!discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    setStatus("Enter a valid Discord webhook URL.", true);
    webhookInput.focus();
    return;
  }

  if (!leetcodeUsername) {
    setStatus("Enter a LeetCode username.", true);
    usernameInput.focus();
    return;
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.discordWebhookUrl]: discordWebhookUrl,
    [STORAGE_KEYS.leetcodeUsername]: leetcodeUsername,
    [STORAGE_KEYS.includeProblemDetails]: includeProblemDetails
  });

  setStatus("Saved.");
});

async function loadSettings() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.discordWebhookUrl,
    STORAGE_KEYS.leetcodeUsername,
    STORAGE_KEYS.includeProblemDetails
  ]);

  webhookInput.value = stored[STORAGE_KEYS.discordWebhookUrl] || "";
  usernameInput.value = stored[STORAGE_KEYS.leetcodeUsername] || "";
  includeProblemDetailsInput.checked = stored[STORAGE_KEYS.includeProblemDetails] === true;
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#b3261e" : "#146c2e";
}
