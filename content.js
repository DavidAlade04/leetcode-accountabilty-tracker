let hasSolved = false;
let currentUrl = window.location.href;

function checkAccepted() {
  if (hasSolved) return;

  // The 'Accepted' text usually appears in a span with specific colors, but we'll check broadly.
  // LeetCode's successful submission text is precisely "Accepted"
  const acceptedElements = Array.from(document.querySelectorAll('*'))
    .filter(el => el.childNodes.length === 1 && el.textContent.trim() === "Accepted");

  if (acceptedElements.length > 0) {
    hasSolved = true;
    chrome.runtime.sendMessage({
      action: "problem_solved",
      url: window.location.href
    });
  }
}

const observer = new MutationObserver(() => {
  // If the user navigates to a different problem (SPA navigation), reset state
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    hasSolved = false;
  }
  checkAccepted();
});

observer.observe(document.body, { childList: true, subtree: true, characterData: true });

// Check initially
checkAccepted();
