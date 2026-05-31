# LeetCode Accountability Tracker

A minimal Chrome extension that sends one Discord webhook notification per local day when `https://leetcode.com` is opened.

Each notification includes the user's LeetCode username, a friendly date like `Saturday 31st May`, their current streak, and one random compliment. Users can also choose to include the LeetCode problem title and difficulty when the visit is to a problem page.

## Setup

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked and select this project folder.
4. Enter your LeetCode username and Discord webhook URL on the settings page.
5. Optionally enable problem details to include the current problem title and difficulty.

Click the extension icon to reopen settings. The extension stores each user's settings, `lastLeetCodeNotificationDate`, and `currentLeetCodeStreak` in `chrome.storage.local`. If the Discord request fails, the date and streak are not saved, so the next LeetCode visit can retry.

Problem details are fetched from LeetCode only when the optional setting is enabled and the current URL is a problem page like `https://leetcode.com/problems/two-sum/`. If the lookup fails, the extension still sends the daily notification.

## Compliments

Add or edit daily messages in `compliments.js`. Keep each compliment as a quoted string inside the `self.DAILY_COMPLIMENTS` array.
