/* MAVI CLASSES · shared Supabase client */
(() => {
  const SUPABASE_URL = "https://vcvkuvildbthkzruhrkr.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_VBzB3tmi2U8-G2NdSTgM0Q_v0veR2-M";
  const load = () => new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase) : reject(new Error("Supabase client did not load."));
    script.onerror = () => reject(new Error("Could not load the secure data connection. Check your internet connection."));
    document.head.appendChild(script);
  });
  window.maviSupabaseReady = load().then(lib => {
    window.maviSupabase = lib.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return window.maviSupabase;
  });
})();