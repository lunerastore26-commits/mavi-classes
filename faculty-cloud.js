/* MAVI CLASSES · public faculty directory */
(() => {
  const grid = document.getElementById("facultyGrid");
  if (!grid || !window.maviSupabaseReady) return;
  const esc = value => String(value || "");
  window.maviSupabaseReady.then(async sb => {
    const { data, error } = await sb.from("faculty_profiles").select("id,name,role,subject,bio,message,photo_path,ratio").order("name");
    if (error) throw error;
    grid.replaceChildren();
    if (!data?.length) {
      const empty=document.createElement("div"); empty.className="faculty-empty";
      const h=document.createElement("h3"); h.textContent="Faculty profiles coming soon";
      const p=document.createElement("p"); p.textContent="Faculty profiles will appear here once added by the institute.";
      empty.append(h,p); grid.append(empty); return;
    }
    data.forEach(item => {
      const card=document.createElement("article"); card.className="faculty-card";
      const img=document.createElement("img");
      img.src=sb.storage.from("mavi-site-assets").getPublicUrl(item.photo_path).data.publicUrl;
      img.alt="Photo of "+esc(item.name); img.loading="lazy";
      const info=document.createElement("div"); info.className="faculty-info";
      const h=document.createElement("h3"); h.textContent=esc(item.name);
      const role=document.createElement("span"); role.className="faculty-role"; role.textContent=esc(item.role);
      const subject=document.createElement("p"); subject.className="faculty-subject"; subject.textContent=esc(item.subject);
      const bio=document.createElement("p"); bio.textContent=esc(item.bio);
      info.append(h,role,subject,bio);
      if(item.message){
        const button=document.createElement("button"); button.type="button"; button.className="faculty-message-trigger"; button.textContent="Read faculty note ↗";
        button.addEventListener("click",()=> {
          const backdrop=document.createElement("div"); backdrop.className="faculty-note-backdrop open";
          const section=document.createElement("section"); section.className="faculty-note"; section.setAttribute("role","dialog"); section.setAttribute("aria-modal","true");
          const close=document.createElement("button"); close.type="button"; close.className="faculty-note-close"; close.textContent="×"; close.setAttribute("aria-label","Close note");
          const kicker=document.createElement("span"); kicker.className="faculty-note-kicker"; kicker.textContent="A NOTE FROM OUR FACULTY";
          const title=document.createElement("h2"); title.textContent=esc(item.name);
          const sub=document.createElement("p"); sub.className="faculty-note-role"; sub.textContent=esc(item.role)+" · "+esc(item.subject);
          const quote=document.createElement("blockquote"); quote.className="faculty-note-copy"; quote.textContent="“"+esc(item.message)+"”";
          section.append(close,kicker,title,sub,quote); backdrop.append(section); document.body.append(backdrop); document.body.classList.add("faculty-note-open");
          const dismiss=()=>{backdrop.remove();document.body.classList.remove("faculty-note-open")};
          close.addEventListener("click",dismiss); backdrop.addEventListener("click",e=>{if(e.target===backdrop)dismiss()});
        });
        info.append(button);
      }
      card.append(img,info); grid.append(card);
    });
  }).catch(err => {
    console.error("MAVI faculty load:",err);
    grid.textContent="Faculty profiles could not be loaded right now. Please try again later.";
  });
})();