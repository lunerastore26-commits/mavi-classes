/* MAVI CLASSES · public cloud content */
(() => {
  const renderFooter = (node, intro) => {
    node.replaceChildren();
    node.appendChild(document.createTextNode(intro));
    const lines = [
      ["Complete address", "2nd Floor, Western Plaza, PL Sharma Road, Begambagh, Meerut, Uttar Pradesh 250001."],
      ["Phone", "+91 96345 95507"],
      ["Office hours", "Monday–Saturday, 8 AM–8 PM"],
      ["Courses & Preparation", "CBSE, B.Sc., NEET, CLAT, IAS, SSC, Police, Airforce Y Group, Banking, TET, Super TET, TGT aur PGT"]
    ];
    lines.forEach(([label, value]) => {
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
        c    // Only the short introduction is editable; institute details remain fixed.
    try {
      let { data, error } = await sb.from("site_settings").select("setting_value").eq("setting_key","footer_intro").maybeSingle();
      if (error) throw error;
      let intro = data?.setting_value;
      if (!intro) {
        const legacy = await sb.from("site_settings").select("setting_value").eq("setting_key","footer_description").maybeSingle();
        if (legacy.error) throw legacy.error;
        intro = String(legacy.data?.setting_value || "").split(/\r?\n/).map(line => line.trim()).find(Boolean);
      }
      if (intro) {
        document.querySelectorAll(".mavi-footer-description").forEach(node => renderFooter(node, intro));
      }
    } catch (err) { console.warn("Cloud footer introduction unavailable; keeping default footer.", err); }

setting_value.split("\\n").forEach((line, i) => {
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