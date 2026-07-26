/**
 * Paste your Supabase project values here.
 * Project Settings → API → Project URL + anon public key
 *
 * Leave empty to use local-only mode (localStorage) for development.
 */
const SUPABASE_CONFIG = {
  url: "https://ztiookighroixwcerrjp.supabase.co",
  anonKey: "sb_publishable_33rvwpHu-5lgUPsD-B5zwg_mLOzGt3N",
};

function isSupabaseConfigured() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}
