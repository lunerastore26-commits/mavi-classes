/* MAVI CLASSES · public cloud content */
(() => {
  const ready = window.maviSupabaseReady;
  if (!ready) return;
  ready.then(async sb => {
    const notice = (el, msg, error=false) => {
      if (!el) return;
      el.textContent = msg;
      el.classList.add("show");
      if (error) el.setAttribute("data-error","true");
      else el.removeAttribute("data-error");
    };

    // Public admission enquiries are stored centrally in Supabase.
    const form = document.getElementById("enquiryForm");
    if (form) {
      form.addEventListener("submit", async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!form.reportValidity()) return;
        const data = Object.fromEntries(new FormData(form).entries());
        const target = form.querySelector('[type="submit"]');
        const n = form.querySelector(".notice") || document.querySelector(".notice");
        if (target) target.disabled = true;
        notice(n, "Submitting your enquiry securely…");
        try {
          const { error } = await sb.from("enquiries").insert({
            student_name: String(data.name || "").trim(),
            phone: String(data.phone || "").trim(),
            email: String(data.email || "").trim() || null,
            course: String(data.course || "").trim(),
            message: String(data.message || "").trim() || null
          });
          if (error) throw error;
          form.reset();
          notice(n, "Thank you. Your enquiry has been received by MAVI CLASSES. Our team can contact you soon.");
        } catch (err) {
          console.error("MAVI enquiry submission:", err);
          notice(n, "We could not send your enquiry right now. Please call +91 96345 95507 or try again.", true);
        } finally { if (target) target.disabled = false; }
      }, { capture: true });
    }

    // Shared footer text is loaded from the cloud when the setting exists.
    try {
      const { data } = await sb.from("site_settings").select("setting_value").eq("setting_key","footer_description").maybeSingle();
      if (data?.setting_value) {
        const nodes = document.querySelectorAll(".mavi-footer-description");
        nodes.forEach(node => {
          node.replaceChildren();
          data.setting_value.split("\\n").forEach((line, i) => {
            if (i) node.appendChild(document.createElement("br"));
            const m = line.match(/^(Complete address|Phone|Office hours|All programmes):\\s*(.*)$/);
            if (!m) { node.appendChild(document.createTextNode(line)); return; }
            const b = document.createElement("strong"); b.textContent = m[1] + ":";
            node.append(b, document.createTextNode(" "));
            if (m[1] === "Phone" && /\\+91\\s?96345\\s?95507/.test(m[2])) {
              const match = m[2].match(/\\+91\\s?96345\\s?95507/);
              node.append(document.createTextNode(m[2].slice(0,match.index)));
              const a = document.createElement("a"); a.href = "tel:+919634595507"; a.textContent = match[0]; node.append(a);
              node.append(document.createTextNode(m[2].slice(match.index+match[0].length)));
            } else node.append(document.createTextNode(m[2]));
          });
        });
      }
    } catch (err) { console.warn("Cloud footer setting unavailable; keeping default footer.", err); }

    // Public replacement photos from the shared Storage bucket.
    try {
      const { data: rows, error } = await sb.from("site_assets").select("asset_key,file_path");
      if (error) throw error;
      const map = new Map((rows || []).map(row => [row.asset_key,row.file_path]));
      document.querySelectorAll("[data-mavi-image-key]").forEach(img => {
        const path = map.get(img.dataset.maviImageKey);
        if (path) img.src = sb.storage.from("mavi-site-assets").getPublicUrl(path).data.publicUrl;
      });
    } catch (err) { console.warn("Cloud site images unavailable; keeping defaults.", err); }
  }).catch(err => console.error("MAVI cloud connection:", err));
})();