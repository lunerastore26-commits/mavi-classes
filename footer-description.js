/* MAVI CLASSES footer: editable introduction + fixed institute details */
(() => {
  const DEFAULT_INTRO = "Meerut's premier coaching institute for CBSE & ICSE, guided by Amit Mavi.";
  const STORAGE_KEY = "maviFooterIntroV1";

  const render = (node, intro) => {
    node.replaceChildren();
    node.appendChild(document.createTextNode(intro || DEFAULT_INTRO));
    const details = [
      ["Complete address", "2nd Floor, Western Plaza, PL Sharma Road, Begambagh, Meerut, Uttar Pradesh 250001."],
      ["Phone", "+91 96345 95507"],
      ["Office hours", "Monday–Saturday, 8 AM–8 PM"],
      ["Courses & Preparation", "CBSE, B.Sc., NEET, CLAT, IAS, SSC, Police, Airforce Y Group, Banking, TET, Super TET, TGT aur PGT"]
    ];
    details.forEach(([label, value]) => {
      node.appendChild(document.createElement("br"));
      node.appendChild(document.createElement("br"));
      const strong = document.createElement("strong");
      strong.textContent = label + ":";
      node.appendChild(strong);
      node.appendChild(document.createTextNode(" "));
      if (label === "Phone") {
        const link = document.createElement("a");
        link.href = "tel:+919634595507";
        link.textContent = value;
        node.appendChild(link);
      } else node.appendChild(document.createTextNode(value));
    });
  };

  const getIntro = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved || DEFAULT_INTRO;
    } catch (_) { return DEFAULT_INTRO; }
  };
  const apply = () => document.querySelectorAll(".mavi-footer-description").forEach(node => render(node, getIntro()));
  apply();
  window.addEventListener("storage", event => { if (event.key === STORAGE_KEY) apply(); });

  const form = document.getElementById("footerDescriptionForm");
  if (!form) return;
  const input = document.getElementById("footerDescriptionInput");
  const counter = document.getElementById("footerDescriptionCounter");
  const notice = document.getElementById("footerDescriptionNotice");
  const updateCounter = () => { if (counter) counter.textContent = input.value.length + " / 300 characters"; };
  input.maxLength = 300;
  input.value = getIntro();
  updateCounter();
  input.addEventListener("input", updateCounter);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || value.length > 300) {
      notice.textContent = "Enter a short introduction of up to 300 characters.";
      notice.style.display = "block";
      notice.style.color = "#a33b32";
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, value);
      apply();
      notice.textContent = "Introduction saved in this browser. Sign in to the admin workspace to publish it online for everyone.";
      notice.style.display = "block";
      notice.style.color = "#276344";
    } catch (_) {
      notice.textContent = "Could not save the introduction in this browser.";
      notice.style.display = "block";
      notice.style.color = "#a33b32";
    }
  });
  const reset = document.getElementById("resetFooterDescription");
  if (reset) reset.addEventListener("click", () => {
    input.value = DEFAULT_INTRO;
    updateCounter();
    try { localStorage.setItem(STORAGE_KEY, DEFAULT_INTRO); apply(); } catch (_) {}
  });
})();
