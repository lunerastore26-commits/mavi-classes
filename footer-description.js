/* MAVI CLASSES footer description editor */
(() => {
  const STORAGE_KEY = "maviFooterDescription";
  const DEFAULT_TEXT = "Meerut's premier coaching institute for all (CBSE & ICSE) — by Amit Mavi";

  const currentText = () => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_TEXT; }
    catch (_) { return DEFAULT_TEXT; }
  };

  const applyFooterDescription = () => {
    const value = currentText();
    document.querySelectorAll(".mavi-footer-description").forEach((node) => {
      node.textContent = value;
    });
  };

  applyFooterDescription();
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applyFooterDescription();
  });

  const form = document.getElementById("footerDescriptionForm");
  if (!form) return;

  const input = document.getElementById("footerDescriptionInput");
  const notice = document.getElementById("footerDescriptionNotice");
  const showNotice = (message, isError = false) => {
    if (!notice) return;
    notice.textContent = message;
    notice.style.color = isError ? "#a33b32" : "#276344";
    notice.style.display = "block";
  };

  input.value = currentText();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      showNotice("Please enter the footer description before saving.", true);
      input.focus();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, value);
      applyFooterDescription();
      showNotice("Footer description saved in this browser. It will appear on MAVI CLASSES pages opened in this same browser.");
    } catch (_) {
      showNotice("Could not save the description in this browser. Please check browser storage settings.", true);
    }
  });

  const reset = document.getElementById("resetFooterDescription");
  if (reset) {
    reset.addEventListener("click", () => {
      input.value = DEFAULT_TEXT;
      try {
        localStorage.setItem(STORAGE_KEY, DEFAULT_TEXT);
        applyFooterDescription();
        showNotice("Default footer description restored in this browser.");
      } catch (_) {
        showNotice("Could not save the default description in this browser.", true);
      }
    });
  }
})();
