import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://knlcmaoazqadlwrqypbo.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGNtYW9henFhZGx3cnF5cGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTQ0MTQsImV4cCI6MjEwMjM3MDQxNH0.D23IgSG7NcTtaiRiXQPLMlLlym4Lxvv-wnGbrzKmcx4";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Browser/client-side Supabase client (uses anon key).
 * Uses @supabase/ssr createBrowserClient so cookies are automatically synced to document.cookie.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client (uses service role key).
 * ONLY use in Server Components, API routes, and webhooks.
 * Never expose to the browser.
 */
export function getSupabaseAdmin() {
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!supabaseUrl || !key) {
    return null;
  }
  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
