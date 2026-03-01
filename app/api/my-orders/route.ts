import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const emailToSearch = user.email.toLowerCase();
  console.log("[my-orders] searching for email:", emailToSearch);

  const { data, error } = await supabase
    .from("orders")
    .select(`*, order_items(*, products(name))`)
    .eq("email", emailToSearch)
    .order("created_at", { ascending: false });

  console.log("[my-orders] found:", data?.length ?? 0, "orders, error:", error?.message);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
