// Supabase project keys are public by design (RLS does the enforcing).
// Env vars win when set; the fallbacks keep preview deploys working.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sfoussxjeewouexusunw.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmb3Vzc3hqZWV3b3VleHVzdW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzNDM3NDEsImV4cCI6MjExMDkxOTc0MX0.giwzf54tSCi6yu7ozi_JBg1RZi2j-iFlqdt7qPpFj_c";
