/* MAVI CLASSES · secure cloud admin */
(() => {
  const $ = s => document.querySelector(s);
  const notice = (el,msg,bad=false) => { if(!el)return; el.textContent=msg; el.classList.add("show"); el.style.color=bad?"#a33b32":""; };
  const loginPanel = $("#cloudAdminLogin");
  const workspace = $("#adminProtectedSections");
  if (!window.maviSupabaseReady) return;
  window.maviSupabaseReady.then(async sb => {
    const {data:{session}} = await sb.auth.getSession();
    async function verify() {
      const {data:{user}} = await sb.auth.getUser();
      if(!user) return false;
      const {data,error} = await sb.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
      if(error) throw error;
      if(!data) return false;
      loginPanel.hidden=true; workspace.hidden=false;
      $("#cloudAdminIdentity").textContent=user.email||"Authorized administrator";
      await Promise.all([renderFaculty(),renderAssets(),renderEnquiries(),loadFooter()]);
      return true;
    }
    if(session) {
      try { if(await verify()) return; await sb.auth.signOut(); }
      catch(e){ await sb.auth.signOut(); notice($("#cloudLoginNotice"),"Could not verify administrator access: "+e.message,true); }
    }
    loginPanel.hidden=false; workspace.hidden=true;
    $("#cloudAdminLoginForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const btn=e.currentTarget.querySelector('[type="submit"]'); btn.disabled=true;
      try{
        const {error}=await sb.auth.signInWithPassword({email:$("#cloudAdminEmail").value.trim(),password:$("#cloudAdminPassword").value});
        if(error) throw error;
        if(!await verify()){
          await sb.auth.signOut();
          throw new Error("This account is not on the MAVI CLASSES admin allowlist yet. Add its Auth user ID to public.admin_users first.");
        }
        notice($("#cloudLoginNotice"),"Secure admin login successful.");
      }catch(err){notice($("#cloudLoginNotice"),err.message,true);}
      finally{btn.disabled=false;}
    });
    $("#cloudAdminCreateAccount").addEventListener("click",async()=>{
      const email=$("#cloudAdminEmail").value.trim(),password=$("#cloudAdminPassword").value;
      if(!email||password.length<8){notice($("#cloudLoginNotice"),"Enter the administrator email and a password of at least 8 characters.",true);return;}
      const button=$("#cloudAdminCreateAccount");button.disabled=true;
      try{
        const {data,error}=await sb.auth.signUp({email,password});
        if(error)throw error;
        if(data.user){
          if(data.session)await sb.auth.signOut();
          notice($("#cloudLoginNotice"),"Account request created. Check the email inbox for Supabase confirmation. After confirming, send me this exact email address so I can authorize it as the first MAVI CLASSES administrator.");
        } else notice($("#cloudLoginNotice"),"If this email is eligible, a confirmation message will arrive shortly.");
      }catch(err){notice($("#cloudLoginNotice"),err.message,true);}
      finally{button.disabled=false;}
    });
    $("#cloudAdminLogout").addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});

    const fileToBlob = async file => new Blob([await file.arrayBuffer()],{type:file.type});
    const upload = async (file,folder) => {
      const ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp" })[file.type];
      if(!ext) throw new Error("Choose a JPG, PNG or WebP image.");
      const path=folder+"/"+crypto.randomUUID()+"."+ext;
      const {error}=await sb.storage.from("mavi-site-assets").upload(path,await fileToBlob(file),{contentType:file.type,upsert:false});
      if(error) throw error;
      return path;
    };

    const facultyForm=$("#facultyForm");
    let editingFaculty=null;
    async function renderFaculty(){
      const {data,error}=await sb.from("faculty_profiles").select("*").order("name");
      if(error) throw error;
      const list=$("#facultyAdminList"); list.replaceChildren();
      if(!data.length){list.textContent="No faculty profiles have been added yet.";return;}
      data.forEach(item=>{
        const row=document.createElement("div");row.className="admin-faculty-row";
        const img=document.createElement("img");img.src=sb.storage.from("mavi-site-assets").getPublicUrl(item.photo_path).data.publicUrl;img.alt="";
        const meta=document.createElement("div");meta.className="admin-faculty-meta";
        const b=document.createElement("b");b.textContent=item.name;
        const small=document.createElement("span");small.textContent=item.role+" · "+item.subject+(item.message?" · Faculty note added":"");meta.append(b,small);
        const actions=document.createElement("div");actions.className="admin-actions";
        const edit=document.createElement("button");edit.type="button";edit.className="btn outline";edit.textContent="Edit";
        edit.onclick=()=>{editingFaculty=item;$("#facultyName").value=item.name;$("#facultyRole").value=item.role;$("#facultySubject").value=item.subject;$("#facultyBio").value=item.bio;$("#facultyMessage").value=item.message||"";$("#facultyRatio").value=item.ratio||"1:1";$("#facultyPhoto").required=false;$("#photoPreview").src=img.src;$("#photoPreview").classList.add("visible");$("#saveFaculty").textContent="Update faculty profile";$("#cancelEdit").hidden=false;window.scrollTo({top:0,behavior:"smooth"});};
        const del=document.createElement("button");del.type="button";del.className="btn danger";del.textContent="Delete";
        del.onclick=async()=>{if(!confirm("Delete this faculty profile?"))return;const {error}=await sb.from("faculty_profiles").delete().eq("id",item.id);if(error){notice($("#adminNotice"),error.message,true);return;}await sb.storage.from("mavi-site-assets").remove([item.photo_path]);await renderFaculty();notice($("#adminNotice"),"Faculty profile deleted.");};
        actions.append(edit,del);row.append(img,meta,actions);list.append(row);
      });
    }
    function resetFaculty(){facultyForm.reset();editingFaculty=null;$("#facultyPhoto").required=true;$("#photoPreview").removeAttribute("src");$("#photoPreview").classList.remove("visible");$("#saveFaculty").textContent="Save faculty profile";$("#cancelEdit").hidden=true;}
    facultyForm.addEventListener("submit",async e=>{
      e.preventDefault();if(!facultyForm.reportValidity())return;
      const btn=$("#saveFaculty");btn.disabled=true;
      try{
        const f=$("#facultyPhoto").files[0];let photoPath=editingFaculty?.photo_path;
        if(f){if(f.size>5*1024*1024)throw new Error("Faculty photo must be under 5 MB.");photoPath=await upload(f,"faculty");}
        if(!photoPath)throw new Error("Please upload a faculty photo.");
        const record={name:$("#facultyName").value.trim(),role:$("#facultyRole").value.trim(),subject:$("#facultySubject").value.trim(),bio:$("#facultyBio").value.trim(),message:$("#facultyMessage").value.trim()||null,ratio:$("#facultyRatio").value,photo_path:photoPath,updated_at:new Date().toISOString()};
        const result=editingFaculty?await sb.from("faculty_profiles").update(record).eq("id",editingFaculty.id):await sb.from("faculty_profiles").insert(record);
        if(result.error)throw result.error;
        if(f&&editingFaculty?.photo_path)await sb.storage.from("mavi-site-assets").remove([editingFaculty.photo_path]);
        resetFaculty();await renderFaculty();notice($("#adminNotice"),"Faculty profile saved online and is now shared across devices.");
      }catch(err){notice($("#adminNotice"),err.message,true);}finally{btn.disabled=false;}
    });
    $("#cancelEdit").addEventListener("click",resetFaculty);

    async function renderEnquiries(){
      const {data,error}=await sb.from("enquiries").select("*").order("created_at",{ascending:false}).limit(100);
      if(error)throw error;
      const list=$("#enquiryAdminList");list.replaceChildren();
      if(!data.length){list.textContent="No admission enquiries have been received yet.";return;}
      data.forEach(item=>{
        const card=document.createElement("article");card.className="admin-faculty-row";card.style.alignItems="flex-start";card.style.flexWrap="wrap";
        const meta=document.createElement("div");meta.className="admin-faculty-meta";meta.style.minWidth="220px";
        const name=document.createElement("b");name.textContent=item.student_name;
        const phone=document.createElement("a");phone.href="tel:"+item.phone.replace(/[^0-9+]/g,"");phone.textContent=item.phone;
        const course=document.createElement("span");course.textContent="Course: "+item.course;
        const email=document.createElement("span");email.textContent=item.email||"No email provided";
        const date=document.createElement("span");date.textContent=new Date(item.created_at).toLocaleString();
        meta.append(name,phone,course,email,date);
        if(item.message){const msg=document.createElement("p");msg.textContent=item.message;meta.append(msg);}
        const controls=document.createElement("div");controls.className="admin-actions";
        const status=document.createElement("select");status.setAttribute("aria-label","Enquiry status for "+item.student_name);
        [["new","New"],["contacted","Contacted"],["closed","Closed"]].forEach(([v,label])=>{const o=document.createElement("option");o.value=v;o.textContent=label;status.append(o);});
        status.value=item.status;
        status.addEventListener("change",async()=>{status.disabled=true;const {error}=await sb.from("enquiries").update({status:status.value}).eq("id",item.id);status.disabled=false;if(error){notice($("#adminNotice"),error.message,true);status.value=item.status;}else{item.status=status.value;notice($("#adminNotice"),"Enquiry status updated.");}});
        controls.append(status);card.append(meta,controls);list.append(card);
      });
    }
    $("#refreshEnquiries").addEventListener("click",()=>renderEnquiries().catch(err=>notice($("#adminNotice"),err.message,true)));

    const imageForm=$("#siteImageForm");
    async function renderAssets(){
      const {data,error}=await sb.from("site_assets").select("*").order("asset_key");if(error)throw error;
      const list=$("#siteImageAdminList");list.replaceChildren();
      if(!data.length){list.textContent="No replacement photos saved yet.";return;}
      data.forEach(item=>{
        const row=document.createElement("div");row.className="admin-faculty-row";
        const img=document.createElement("img");img.src=sb.storage.from("mavi-site-assets").getPublicUrl(item.file_path).data.publicUrl;img.alt="";
        const meta=document.createElement("div");meta.className="admin-faculty-meta";const b=document.createElement("b");b.textContent=item.asset_key;const small=document.createElement("span");small.textContent=item.ratio+" crop · shared online";meta.append(b,small);
        const del=document.createElement("button");del.type="button";del.className="btn danger";del.textContent="Restore original";
        del.onclick=async()=>{if(!confirm("Restore the original website photo?"))return;const {error}=await sb.from("site_assets").delete().eq("asset_key",item.asset_key);if(error){notice($("#imageAdminNotice"),error.message,true);return;}await sb.storage.from("mavi-site-assets").remove([item.file_path]);await renderAssets();notice($("#imageAdminNotice"),"Original website photo restored for all visitors.");};
        row.append(img,meta,del);list.append(row);
      });
    }
    imageForm.addEventListener("submit",async e=>{
      e.preventDefault();const f=$("#siteImageFile").files[0];if(!f){notice($("#imageAdminNotice"),"Choose a photo first.",true);return;}if(f.size>8*1024*1024){notice($("#imageAdminNotice"),"Photo must be under 8 MB.",true);return;}
      const btn=imageForm.querySelector('[type="submit"]');btn.disabled=true;
      try{
        const key=$("#siteImageSlot").value,ratio=$("#siteImageRatio").value,path=await upload(f,"site");
        const {data:old}=await sb.from("site_assets").select("file_path").eq("asset_key",key).maybeSingle();
        const {error}=await sb.from("site_assets").upsert({asset_key:key,ratio,file_path:path,updated_at:new Date().toISOString()},{onConflict:"asset_key"});
        if(error)throw error;
        if(old?.file_path)await sb.storage.from("mavi-site-assets").remove([old.file_path]);
        imageForm.reset();$("#siteImagePreview").removeAttribute("src");$("#siteImagePreview").classList.remove("visible");await renderAssets();notice($("#imageAdminNotice"),"Website photo published online for all visitors.");
      }catch(err){notice($("#imageAdminNotice"),err.message,true);}finally{btn.disabled=false;}
    });

    const footerForm=$("#footerDescriptionForm");
    const DEFAULT_FOOTER_INTRO="Meerut's premier coaching institute for CBSE & ICSE, guided by Amit Mavi.";
    const footerInput=$("#footerDescriptionInput");
    const footerCounter=$("#footerDescriptionCounter");
    const updateFooterCounter=()=>{footerCounter.textContent=footerInput.value.length+" / 300 characters";};
    async function loadFooter(){
      let {data,error}=await sb.from("site_settings").select("setting_value").eq("setting_key","footer_intro").maybeSingle();
      if(error) throw error;
      if(!data?.setting_value){
        const legacy=await sb.from("site_settings").select("setting_value").eq("setting_key","footer_description").maybeSingle();
        if(legacy.error) throw legacy.error;
        const firstLine=String(legacy.data?.setting_value||"").split(/\\r?\\n/).map(x=>x.trim()).find(Boolean);
        footerInput.value=firstLine||DEFAULT_FOOTER_INTRO;
      } else footerInput.value=data.setting_value;
      footerInput.value=footerInput.value.slice(0,300);
      updateFooterCounter();
    }
    footerInput.addEventListener("input",updateFooterCounter);
    footerForm.addEventListener("submit",async e=>{
      e.preventDefault();
      const value=footerInput.value.trim();
      if(!value||value.length>300){notice($("#footerDescriptionNotice"),"Enter a short introduction of up to 300 characters.",true);return;}
      const {error}=await sb.from("site_settings").upsert({setting_key:"footer_intro",setting_value:value,updated_at:new Date().toISOString()},{onConflict:"setting_key"});
      if(error){notice($("#footerDescriptionNotice"),error.message,true);return;}
      notice($("#footerDescriptionNotice"),"Short footer introduction saved online for all visitors. Address, phone, office hours and Courses & Preparation remain unchanged.");
    });
    $("#resetFooterDescription").addEventListener("click",async()=>{
      footerInput.value=DEFAULT_FOOTER_INTRO;updateFooterCounter();
      const {error}=await sb.from("site_settings").upsert({setting_key:"footer_intro",setting_value:DEFAULT_FOOTER_INTRO,updated_at:new Date().toISOString()},{onConflict:"setting_key"});
      notice($("#footerDescriptionNotice"),error?error.message:"Default introduction restored online.",!!error);
    });

  }).catch(err=>{loginPanel.hidden=false;workspace.hidden=true;notice($("#cloudLoginNotice"),"Cloud setup error: "+err.message,true);});
})();