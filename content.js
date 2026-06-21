let hasSolved = false;
let currentUrl = window.location.href;
let lastSubmitTime = 0;

// Listen for clicks on the Submit button as an extra heuristic
document.addEventListener("click", (e) => {
  const submitBtn = e.target.closest('[data-e2e-locator="console-submit-button"]');
  if (submitBtn || (e.target.tagName === "BUTTON" && e.target.textContent.trim() === "Submit")) {
    lastSubmitTime = Date.now();
  }
});

function checkAccepted() {
  if (hasSolved) return;

  let isAccepted = false;

  // 1. Primary Check: Look for LeetCode's specific submission result element
  const submissionResult = document.querySelector('[data-e2e-locator="submission-result"]');
  if (submissionResult && submissionResult.textContent.trim() === "Accepted") {
    isAccepted = true;
  } 
  // 2. Fallback Check: Broad check, but ONLY if we clicked the Submit button recently (within the last 60 seconds)
  else if (Date.now() - lastSubmitTime < 60000) {
    const acceptedElements = Array.from(document.querySelectorAll('*'))
      .filter(el => el.childNodes.length === 1 && el.textContent.trim() === "Accepted");
    
    if (acceptedElements.length > 0) {
      isAccepted = true;
    }
  }

  if (isAccepted) {
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
    lastSubmitTime = 0; // Reset submit timer
  }
  checkAccepted();
});

observer.observe(document.body, { childList: true, subtree: true, characterData: true });

// Check initially
checkAccepted();

