import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  let str = String(value);
  // Prevent formula injection: prefix dangerous leading chars so spreadsheets
  // don't interpret them as formulas (=, +, -, @, tab, carriage return)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.startsWith("'")) {
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

  if (!["delivery", "pickup", "all", "marketing"].includes(type)) {
    return NextResponse.json(
      { error: "type must be 'delivery', 'pickup', 'all', or 'marketing'" },
      { status: 400 }
    );
  }

  // Marketing email list export
  if (type === "marketing") {
    const { data: marketingOrders, error: mError } = await supabase
      .from("orders")
      .select("first_name, last_name, email, phone, created_at")
      .eq("marketing_optin", true)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (mError) {
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Deduplicate by email, keeping the most recent entry
    const seen = new Set<string>();
    const unique: { first_name: string; last_name: string; email: string; phone: string }[] = [];
    for (const o of marketingOrders ?? []) {
      const key = o.email.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(o);
      }
    }

    const mRows: string[] = [toCSVRow(["First Name", "Last Name", "Email", "Mobile Number"])];
    for (const o of unique) {
      mRows.push(toCSVRow([o.first_name, o.last_name, o.email, o.phone]));
    }

    const mCsv = mRows.join("\n");
    return new NextResponse(mCsv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="danskys-marketing-emails-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // Fetch products in sort order to use as columns
  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock_quantity")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const productList = products ?? [];

  let query = supabase
    .from("orders")
    .select(
      `
      id, first_name, last_name, phone,
      delivery_method,
      address_line1, address_line2, postcode,
      neighbour_name, neighbour_address,
      notes, created_at,
      order_items (
        quantity,
        product_id,
        products ( id, name )
      )
    `
    )
    .neq("status", "cancelled");

  if (type !== "all") {
    query = query.eq("delivery_method", type);
  }

  query = query.order(
    type === "delivery" ? "address_line2" : "last_name",
    { ascending: true }
  );

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const rows: string[] = [];

  // Build short display names for column headers
  const productHeaders = productList.map((p) => {
    if (p.name.toLowerCase().includes("bodek")) return "Bodek";
    if (p.name.toLowerCase().includes("alei katif")) return "Alei Katif";
    if (p.name.toLowerCase().includes("cheffman")) return "Cheffman's";
    return p.name;
  });

  const baseHeaders = type === "pickup"
    ? ["First Name", "Last Name", "Mobile Number", "Door Number / Name", "Street", "Postcode"]
    : type === "all"
    ? ["Type", "First Name", "Last Name", "Mobile Number", "Door Number / Name", "Street", "Postcode", "Neighbour Name", "Neighbour Door Number"]
    : ["First Name", "Last Name", "Mobile Number", "Door Number / Name", "Street", "Postcode", "Neighbour Name", "Neighbour Door Number"];

  rows.push(toCSVRow([...baseHeaders, ...productHeaders, "Total Items", "Notes"]));

  // Grand totals per product
  const grandTotals: Record<string, number> = {};
  productList.forEach((p) => { grandTotals[p.id] = 0; });

  for (const order of orders ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const oi of (order.order_items ?? []) as any[]) {
      const pid = oi.product_id ?? oi.products?.id;
      if (pid) {
        itemMap[pid] = (itemMap[pid] ?? 0) + oi.quantity;
        grandTotals[pid] = (grandTotals[pid] ?? 0) + oi.quantity;
      }
    }

    const productQtys = productList.map((p) => String(itemMap[p.id] ?? 0));
    const totalItems = productList.reduce((sum, p) => sum + (itemMap[p.id] ?? 0), 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderAny = order as any;
    const baseValues = type === "pickup"
      ? [order.first_name, order.last_name, order.phone, order.address_line1, order.address_line2, order.postcode]
      : type === "all"
      ? [orderAny.delivery_method === "delivery" ? "Delivery" : "Pickup", order.first_name, order.last_name, order.phone, order.address_line1, order.address_line2, order.postcode, order.neighbour_name, order.neighbour_address]
      : [order.first_name, order.last_name, order.phone, order.address_line1, order.address_line2, order.postcode, order.neighbour_name, order.neighbour_address];

    rows.push(toCSVRow([...baseValues, ...productQtys, String(totalItems), order.notes]));
  }

  // Grand total row
  const grandProductTotals = productList.map((p) => String(grandTotals[p.id] ?? 0));
  const grandTotal = productList.reduce((sum, p) => sum + (grandTotals[p.id] ?? 0), 0);
  const blankBase = type === "pickup"
    ? ["TOTAL", "", "", "", "", ""]
    : type === "all"
    ? ["TOTAL", "", "", "", "", "", "", "", ""]
    : ["TOTAL", "", "", "", "", "", "", ""];

  rows.push(toCSVRow([...blankBase, ...grandProductTotals, String(grandTotal), ""]));

  // In stock row
  const stockValues = productList.map((p) => {
    const sq = (p as { id: string; name: string; stock_quantity?: number | null }).stock_quantity;
    return sq != null ? String(sq) : "";
  });
  const inStockBase = type === "pickup"
    ? ["IN STOCK", "", "", "", "", ""]
    : type === "all"
    ? ["IN STOCK", "", "", "", "", "", "", "", ""]
    : ["IN STOCK", "", "", "", "", "", "", ""];
  rows.push(toCSVRow([...inStockBase, ...stockValues, "", ""]));

  const csv = rows.join("\n");
  const filename = type === "all"
    ? `danskys-all-orders-${new Date().toISOString().slice(0, 10)}.csv`
    : `danskys-${type}s-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
