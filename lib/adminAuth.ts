import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Verify the request comes from an authenticated admin user.
 * Returns the user's email if verified, null otherwise.
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL env var not set");
    return null;
  }

  const cookieStore = request.cookies;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Read-only in middleware
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (user.email?.toLowerCase() !== adminEmail.toLowerCase()) return null;

  return user.email;
}
