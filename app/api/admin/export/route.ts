import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSVRow(values: (string | null | undefined)[]): string {
  return values.map(escapeCSV).join(",");
}

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

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  if (user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "delivery";

  if (!["delivery", "pickup"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'delivery' or 'pickup'" },
      { status: 400 }
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id, first_name, last_name, phone,
      address_line1, address_line2, postcode,
      neighbour_name, neighbour_address,
      notes, created_at,
      order_items (
        quantity,
        products ( name )
      )
    `
    )
    .eq("delivery_method", type)
    .neq("status", "cancelled")
    .order(
      // Home delivery sorted by street (address_line2); pickup sorted by last name
      type === "delivery" ? "address_line2" : "last_name",
      { ascending: true }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const rows: string[] = [];

  if (type === "delivery") {
    rows.push(
      toCSVRow([
        "First Name",
        "Last Name",
        "Mobile Number",
        "Door Number / Name",
        "Street",
        "Postcode",
        "Neighbour Name",
        "Neighbour Door Number",
        "Variants",
        "Quantities",
        "Notes",
      ])
    );

    for (const order of orders ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variants = (order.order_items ?? []).map((oi: any) => oi.products?.name ?? "Unknown").join(" | ");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quantities = (order.order_items ?? []).map((oi: any) => String(oi.quantity)).join(" | ");

      rows.push(
        toCSVRow([
          order.first_name,
          order.last_name,
          order.phone,
          order.address_line1,
          order.address_line2,
          order.postcode,
          order.neighbour_name,
          order.neighbour_address,
          variants,
          quantities,
          order.notes,
        ])
      );
    }
  } else {
    rows.push(
      toCSVRow([
        "First Name",
        "Last Name",
        "Mobile Number",
        "Variants",
        "Quantities",
        "Notes",
      ])
    );

    for (const order of orders ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variants = (order.order_items ?? []).map((oi: any) => oi.products?.name ?? "Unknown").join(" | ");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quantities = (order.order_items ?? []).map((oi: any) => String(oi.quantity)).join(" | ");

      rows.push(
        toCSVRow([
          order.first_name,
          order.last_name,
          order.phone,
          variants,
          quantities,
          order.notes,
        ])
      );
    }
  }

  const csv = rows.join("\n");
  const filename = `danskys-${type}s-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
