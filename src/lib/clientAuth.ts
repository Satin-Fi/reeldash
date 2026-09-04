import { getSupabaseClient } from "./supabase";

/**
 * Get HTTP headers for authenticated API calls from client components.
 *
 * Includes:
 * 1. Authorization: Bearer <supabase_access_token>
 * 2. x-user-id: <user_id>
 */
export async function getClientAuthHeaders(userId?: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
    } catch {}
  }

  // Fallback x-user-id header from argument or localStorage
  if (userId) {
    headers["x-user-id"] = userId;
  } else if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("reeldash_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          headers["x-user-id"] = parsed.id;
        }
      }
    } catch {}
  }

  return headers;
}
