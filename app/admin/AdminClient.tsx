"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Order, Product } from "@/types";
import {
  Loader2,
  AlertCircle,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  Store,
  DollarSign,
  Users,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { FormInput } from "@/components/FormInput";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

type FilterType = "all" | "delivery" | "pickup";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#f59e0b" },
  payment_authorized: { label: "Authorised", color: "#3b82f6" },
  payment_captured: { label: "Paid", color: "#2d6e3e" },
  ready_for_pickup: { label: "Ready for Pickup", color: "#2d6e3e" },
  out_for_delivery: { label: "Out for Delivery", color: "#8b5cf6" },
  completed: { label: "Completed", color: "#6b7280" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  refunded: { label: "Refunded", color: "#f97316" },
};

interface EnrichedOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  products: Product | null;
}

type EnrichedOrder = Omit<Order, "order_items"> & {
  order_items: EnrichedOrderItem[];
};

export default function AdminClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedOrder, setSelectedOrder] = useState<EnrichedOrder | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const params = filter !== "all" ? `?delivery_method=${filter}` : "";
      const res = await fetch(`/api/admin/orders${params}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      if (res.ok) setOrders(Array.isArray(data) ? data as EnrichedOrder[] : []);
    } catch {
      // leave orders as-is on network error
    } finally {
      setOrdersLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user && isAdmin(user)) {
      loadOrders();
    }
  }, [user, loadOrders]);

  function isAdmin(u: User) {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    return adminEmail && u.email?.toLowerCase() === adminEmail.toLowerCase();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  }

  async function handleExport(type: "delivery" | "pickup" | "all" | "marketing") {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/admin/export?type=${type}`, {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = type === "all"
      ? `danskys-all-orders-${new Date().toISOString().slice(0, 10)}.csv`
      : type === "marketing"
      ? `danskys-marketing-emails-${new Date().toISOString().slice(0, 10)}.csv`
      : `danskys-${type}s-${new Date().toISOString().slice(0, 10)}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(orderId: string) {
    if (!confirm("Permanently delete this order? This cannot be undone.")) return;
    setDeletingOrderId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setSelectedOrder(null);
        await loadOrders();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete order");
      }
    } finally {
      setDeletingOrderId(null);
    }
  }

  const stats = {
    total: orders.filter((o) => o.status !== "cancelled").length,
    deliveries: orders.filter((o) => o.delivery_method === "delivery" && o.status !== "cancelled").length,
    pickups: orders.filter((o) => o.delivery_method === "pickup" && o.status !== "cancelled").length,
    revenue: orders
      .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + Number(o.total), 0),
    productQuantities: orders
      .filter((o) => o.status !== "cancelled")
      .flatMap((o) => o.order_items ?? [])
      .reduce((acc, item) => {
        const name = item.products?.name ?? "Unknown";
        acc[name] = (acc[name] ?? 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>),
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2d6e3e]" size={32} />
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-3">
              Restricted
            </p>
            <h1
              className="text-2xl font-bold text-[#1c3320] mb-2"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              Admin Access
            </h1>
            <p className="text-[#1c3320]/50 text-sm">
              {user ? "You do not have admin access." : "Sign in with your admin account."}
            </p>
          </div>
          {!user && (
            <form
              onSubmit={handleLogin}
              className="bg-white border border-[#c5e0cc] rounded-2xl p-6 space-y-4 shadow-sm"
            >
              <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FormInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {authError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle size={14} />
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#2d6e3e] hover:bg-[#245730] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {authLoading && <Loader2 size={16} className="animate-spin" />}
                Sign In
              </button>
            </form>
          )}
          {user && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full py-3 border border-[#c5e0cc] text-[#1c3320]/60 hover:text-[#1c3320] rounded-xl text-sm transition-colors"
            >
              Sign out and try another account
            </button>
          )}
        </div>
      </div>
    );
  }

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.delivery_method === filter);

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-1">
              Admin Panel
            </p>
            <h1
              className="text-2xl font-bold text-[#1c3320]"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              Danskys Pesach Lettuce — Order Management
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport("delivery")}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 hover:text-[#1c3320] text-sm rounded-lg transition-colors"
            >
              <Download size={14} />
              Deliveries CSV
            </button>
            <button
              onClick={() => handleExport("pickup")}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 hover:text-[#1c3320] text-sm rounded-lg transition-colors"
            >
              <Download size={14} />
              Pickups CSV
            </button>
            <button
              onClick={() => handleExport("all")}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 hover:text-[#1c3320] text-sm rounded-lg transition-colors"
            >
              <Download size={14} />
              All Orders CSV
            </button>
            <button
              onClick={() => handleExport("marketing")}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 hover:text-[#1c3320] text-sm rounded-lg transition-colors"
            >
              <Download size={14} />
              Marketing Emails CSV
            </button>
            <button
              onClick={loadOrders}
              className="p-2 bg-white border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 hover:text-[#1c3320] rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-2 border border-[#c5e0cc] text-[#1c3320]/40 hover:text-red-500 hover:border-red-300 text-sm rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Orders", value: stats.total, icon: <Package size={18} />, sub: "excl. cancelled" },
            { label: "Deliveries", value: stats.deliveries, icon: <Truck size={18} />, sub: "home delivery" },
            { label: "Pickups", value: stats.pickups, icon: <Store size={18} />, sub: "in-store" },
            { label: "Revenue", value: `£${stats.revenue.toFixed(2)}`, icon: <DollarSign size={18} />, sub: "total sales" },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-[#c5e0cc] rounded-xl p-4">
              <div className="flex items-center gap-2 text-[#2d6e3e] mb-2">
                {card.icon}
                <span className="text-xs font-medium uppercase tracking-wider">{card.label}</span>
              </div>
              <p
                className="text-2xl font-bold text-[#1c3320]"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                {card.value}
              </p>
              <p className="text-[#1c3320]/40 text-xs mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Product Quantities */}
        {Object.keys(stats.productQuantities).length > 0 && (
          <div className="bg-white border border-[#c5e0cc] rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-[#2d6e3e]" />
              <span className="text-[#2d6e3e] text-xs font-medium uppercase tracking-wider">
                Product Quantities (active orders)
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.productQuantities).map(([name, qty]) => {
                const originalStock =
                  name.toLowerCase().includes("alei katif") ? 270 :
                  name.toLowerCase().includes("bodek") ? 480 :
                  name.toLowerCase().includes("cheffman") ? 500 :
                  null;
                return (
                  <div key={name} className="px-3 py-1.5 bg-[#f2faf3] border border-[#c5e0cc] rounded-lg text-sm">
                    <span className="text-[#1c3320]/70">{name}:</span>{" "}
                    <span className="text-[#2d6e3e] font-semibold">{qty}</span>
                    {originalStock != null && (
                      <span className="text-[#1c3320]/40"> / {originalStock}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(["all", "delivery", "pickup"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? "bg-[#2d6e3e] text-white"
                  : "bg-white border border-[#c5e0cc] text-[#1c3320]/60 hover:text-[#1c3320] hover:border-[#2d6e3e]/40"
              }`}
            >
              {f === "all" ? `All (${orders.length})` : f === "delivery" ? `Delivery (${stats.deliveries})` : `Pickup (${stats.pickups})`}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-[#c5e0cc] rounded-xl overflow-hidden">
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[#2d6e3e]" size={28} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-[#1c3320]/40 text-sm">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#c5e0cc] text-[#1c3320]/50 text-xs uppercase tracking-wider bg-[#f2faf3]">
                    <th className="p-3 text-left">Ref</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Items</th>
                    <th className="p-3 text-left">Total</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[#c5e0cc]/60 hover:bg-[#f2faf3] transition-colors"
                      >
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="font-mono text-[#2d6e3e] hover:underline font-semibold"
                          >
                            #{order.id.slice(0, 8).toUpperCase()}
                          </button>
                        </td>
                        <td className="p-3">
                          <p className="text-[#1c3320] font-medium">
                            {order.first_name} {order.last_name}
                          </p>
                          <p className="text-[#1c3320]/40 text-xs">{order.email}</p>
                        </td>
                        <td className="p-3">
                          <span className="text-[#1c3320]/70">
                            {order.delivery_method === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}
                          </span>
                        </td>
                        <td className="p-3 text-[#1c3320]/70">
                          {(order.order_items ?? []).reduce((s, i) => s + i.quantity, 0)}{" "}
                          item{(order.order_items ?? []).reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                        </td>
                        <td className="p-3 text-[#2d6e3e] font-semibold">
                          £{Number(order.total).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${statusInfo.color}18`,
                              color: statusInfo.color,
                            }}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3 text-[#1c3320]/50 text-xs whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        <Dialog.Root open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
            <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-[#c5e0cc] overflow-y-auto p-6 shadow-2xl">
              {selectedOrder && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Dialog.Title
                        className="text-xl font-bold text-[#1c3320]"
                        style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                      >
                        Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                      </Dialog.Title>
                      <Dialog.Description className="text-[#1c3320]/40 text-sm mt-0.5">
                        {new Date(selectedOrder.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </Dialog.Description>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(selectedOrder.id)}
                        disabled={deletingOrderId === selectedOrder.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingOrderId === selectedOrder.id ? "Deleting…" : "Delete"}
                      </button>
                      <Dialog.Close className="p-2 text-[#1c3320]/40 hover:text-[#1c3320] transition-colors">
                        ✕
                      </Dialog.Close>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${STATUS_LABELS[selectedOrder.status]?.color ?? "#888"}18`,
                          color: STATUS_LABELS[selectedOrder.status]?.color ?? "#888",
                        }}
                      >
                        {STATUS_LABELS[selectedOrder.status]?.label ?? selectedOrder.status}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs bg-[#f2faf3] text-[#1c3320]/60 border border-[#c5e0cc]">
                        Payment: {selectedOrder.payment_status}
                      </span>
                    </div>

                    <Section title="Customer">
                      <Row label="Name" value={`${selectedOrder.first_name} ${selectedOrder.last_name}`} />
                      <Row label="Email" value={selectedOrder.email} />
                      <Row label="Phone" value={selectedOrder.phone} />
                    </Section>

                    <Section title={selectedOrder.delivery_method === "delivery" ? "Delivery Address" : "Pickup"}>
                      {selectedOrder.delivery_method === "delivery" ? (
                        <>
                          <Row label="Address" value={[selectedOrder.address_line1, selectedOrder.address_line2, selectedOrder.city, selectedOrder.postcode].filter(Boolean).join(", ")} />
                          {selectedOrder.neighbour_name && (
                            <Row label="Neighbour" value={`${selectedOrder.neighbour_name} (${selectedOrder.neighbour_address})`} />
                          )}
                        </>
                      ) : (
                        <>
                          <Row label="Method" value="In-store pickup" />
                          {selectedOrder.address_line1 && (
                            <Row label="Address" value={[selectedOrder.address_line1, selectedOrder.address_line2, selectedOrder.postcode].filter(Boolean).join(", ")} />
                          )}
                        </>
                      )}
                    </Section>

                    <Section title="Items">
                      {(selectedOrder.order_items ?? []).map((item, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-[#c5e0cc]/50 last:border-0">
                          <span className="text-[#1c3320]/70">
                            {item.products?.name ?? "Unknown"} × {item.quantity}
                          </span>
                          <span className="text-[#1c3320]">
                            £{(item.price_at_time * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 font-semibold text-[#2d6e3e]">
                        <span>Total</span>
                        <span>£{Number(selectedOrder.total).toFixed(2)}</span>
                      </div>
                    </Section>

                    {selectedOrder.notes && (
                      <Section title="Notes">
                        <p className="text-[#1c3320]/60">{selectedOrder.notes}</p>
                      </Section>
                    )}

                    {selectedOrder.blink_transaction_id && (
                      <Section title="Payment Reference">
                        <Row label="Blink TX ID" value={selectedOrder.blink_transaction_id} />
                      </Section>
                    )}
                  </div>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-[#c5e0cc] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-[#2d6e3e] text-xs font-medium uppercase tracking-wider"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-4 pb-4 space-y-1.5">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-[#1c3320]/40 min-w-[90px] shrink-0">{label}</span>
      <span className="text-[#1c3320]/80 break-all">{value ?? "—"}</span>
    </div>
  );
}
