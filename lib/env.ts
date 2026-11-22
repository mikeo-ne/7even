// Supabase project "7even" (eu-west-1). These values are public by design —
// every table is protected by row-level security, not by key secrecy.
// Env vars win when present; the fallbacks keep Vercel previews working when a
// deployment has no environment configured.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://sfoussxjeewouexusunw.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmb3Vzc3hqZWV3b3VleHVzdW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzNDM3NDEsImV4cCI6MjExMDkxOTc0MX0.giwzf54tSCi6yu7ozi_JBg1RZi2j-iFlqdt7qPpFj_c";
