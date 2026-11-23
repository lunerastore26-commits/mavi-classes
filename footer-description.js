/* MAVI CLASSES footer description editor */
(() => {
  const STORAGE_KEY = "maviFooterDescriptionV2";
  const DEFAULT_TEXT = "Meerut's premier coaching institute for all (CBSE & ICSE) — by Amit Mavi\n\nComplete address: 2nd Floor, Western Plaza, PL Sharma Road, Begambagh, Meerut, Uttar Pradesh 250001.\nPhone: +91 96345 95507 — clickable calling link.\nOffice hours: Monday–Saturday, 8 AM–8 PM.\nAll programmes: CBSE, B.Sc., NEET, CLAT, IAS, SSC, Police, Airforce Y Group, Banking, TET, Super TET, TGT aur PGT.";
  const currentText = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved || saved === "Meerut's premier coaching institute for all (CBSE & ICSE) — by Amit Mavi") {
        localStorage.setItem(STORAGE_KEY, DEFAULT_TEXT);
        return DEFAULT_TEXT;
      }
      return saved;
    }
    catch (_) { return DEFAULT_TEXT; }
  };

  const renderDescription = (node, value) => {
    node.replaceChildren();
    value.split("\n").forEach((line, index) => {
      if (index) node.appendChild(document.createElement("br"));
      if (!line) return;
      const match = line.match(/^(Complete address|Phone|Office hours|All programmes):\s*(.*)$/);
      if (!match) {
        node.appendChild(document.createTextNode(line));
        return;
      }
      const strong = document.createElement("strong");
      strong.textContent = match[1] + ":";
      node.appendChild(strong);
      node.appendChild(document.createTextNode(" "));
      if (match[1] === "Phone") {
        const phoneMatch = match[2].match(/(\+91\s?96345\s?95507)/);
        if (phoneMatch) {
          const before = match[2].slice(0, phoneMatch.index);
          if (before) node.appendChild(document.createTextNode(before));
          const link = document.createElement("a");
          link.href = "tel:+919634595507";
          link.textContent = phoneMatch[0];
          node.appendChild(link);
          node.appendChild(document.createTextNode(match[2].slice(phoneMatch.index + phoneMatch[0].length)));
        } else node.appendChild(document.createTextNode(match[2]));
      } else node.appendChild(document.createTextNode(match[2]));
    });
  };

  const applyFooterDescription = () => {
    const value = currentText();
    document.querySelectorAll(".mavi-footer-description").forEach(node => renderDescription(node, value));
  };
  applyFooterDescription();
  window.addEventListener("storage", event => {
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
  form.addEventListener("submit", event => {
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
      showNotice("Footer details saved in this browser. They appear on pages opened in this same browser.");
    } catch (_) {
      showNotice("Could not save the description in this browser. Please check browser storage settings.", true);
    }
  });
  const reset = document.getElementById("resetFooterDescription");
  if (reset) reset.addEventListener("click", () => {
    input.value = DEFAULT_TEXT;
    try {
      localStorage.setItem(STORAGE_KEY, DEFAULT_TEXT);
      applyFooterDescription();
      showNotice("Default footer details restored in this browser.");
    } catch (_) { showNotice("Could not save the default description in this browser.", true); }
  });
})();
