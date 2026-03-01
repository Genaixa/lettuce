"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Order } from "@/types";
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  User as UserIcon,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
import { FormInput } from "@/components/FormInput";

type Tab = "dashboard" | "orders" | "addresses" | "account";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#f59e0b" },
  payment_authorized: { label: "Authorised", color: "#3b82f6" },
  payment_captured: { label: "Paid", color: "#10b981" },
  ready_for_pickup: { label: "Ready for Pickup", color: "#10b981" },
  out_for_delivery: { label: "Out for Delivery", color: "#8b5cf6" },
  completed: { label: "Completed", color: "#6b7280" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  refunded: { label: "Refunded", color: "#f97316" },
};

export default function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && tab === "orders") {
      loadOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/my-orders", {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/my-account` },
        });
        if (error) throw error;
        setAuthSuccess("Account created! Please check your email to confirm your account.");
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setTab("dashboard");
  }

  async function handlePasswordReset() {
    if (!email) {
      setAuthError("Enter your email address above first");
      return;
    }
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/my-account`,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess("Password reset email sent. Check your inbox.");
    }
    setAuthLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2d6e3e]" size={32} />
      </div>
    );
  }

  // Not logged in — show auth form
  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-[#1c3320] mb-2"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
            >
              My Account
            </h1>
            <p className="text-[#1c3320]/50 text-sm">
              {authMode === "login"
                ? "Sign in to view your orders"
                : "Create an account to track your orders"}
            </p>
          </div>

          <div className="bg-white border border-[#c5e0cc] rounded-2xl p-6 shadow-sm">
            {/* Tab switcher */}
            <div className="flex rounded-xl overflow-hidden border border-[#c5e0cc] mb-6">
              {(["login", "register"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setAuthMode(mode);
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    authMode === mode
                      ? "bg-[#2d6e3e] text-white"
                      : "text-[#1c3320]/60 hover:text-[#1c3320] hover:bg-[#f2faf3]"
                  }`}
                >
                  {mode === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <FormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <FormInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                helper={authMode === "register" ? "Minimum 8 characters" : undefined}
              />

              {authError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <CheckCircle size={15} className="shrink-0 mt-0.5" />
                  {authSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#2d6e3e] hover:bg-[#245730] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {authLoading && <Loader2 size={16} className="animate-spin" />}
                {authMode === "login" ? "Sign In" : "Create Account"}
              </button>

              {authMode === "login" && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="w-full text-center text-[#2d6e3e]/70 hover:text-[#2d6e3e] text-sm transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Logged in
  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "orders" as Tab, label: "Orders", icon: ShoppingBag },
    { id: "addresses" as Tab, label: "Addresses", icon: MapPin },
    { id: "account" as Tab, label: "Account", icon: UserIcon },
  ];

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1
          className="text-2xl font-bold text-[#1c3320] mb-8"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Welcome back, {user.email?.split("@")[0]}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="bg-white border border-[#c5e0cc] rounded-xl p-2 space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    tab === id
                      ? "bg-[#e8f5eb] text-[#2d6e3e] border border-[#c5e0cc]"
                      : "text-[#1c3320]/60 hover:text-[#1c3320] hover:bg-[#f2faf3]"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
              {user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                <a
                  href="/admin"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#c9a84c]/80 hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
                >
                  <ShieldCheck size={16} />
                  Admin Panel
                </a>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500/70 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </nav>
          </div>

          {/* Main content */}
          <div className="md:col-span-3">
            {tab === "dashboard" && (
              <div className="bg-white border border-[#c5e0cc] rounded-xl p-6">
                <h2
                  className="text-xl font-semibold text-[#1c3320] mb-4"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  Dashboard
                </h2>
                <p className="text-[#1c3320]/60 text-sm mb-6">
                  Manage your Pesach lettuce pre-orders from here.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setTab("orders")}
                    className="flex items-center gap-4 p-4 bg-[#f2faf3] border border-[#c5e0cc] hover:border-[#2d6e3e]/40 hover:shadow-sm rounded-xl transition-all text-left"
                  >
                    <ShoppingBag size={22} className="text-[#2d6e3e]" />
                    <div>
                      <p className="text-[#1c3320] font-medium text-sm">My Orders</p>
                      <p className="text-[#1c3320]/40 text-xs">View order history</p>
                    </div>
                  </button>
                  <a
                    href="/order"
                    className="flex items-center gap-4 p-4 bg-[#f2faf3] border border-[#c5e0cc] hover:border-[#2d6e3e]/40 hover:shadow-sm rounded-xl transition-all"
                  >
                    <span className="text-2xl">🥬</span>
                    <div>
                      <p className="text-[#1c3320] font-medium text-sm">New Pre-Order</p>
                      <p className="text-[#1c3320]/40 text-xs">Order for this Pesach</p>
                    </div>
                  </a>
                  {user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                    <a
                      href="/admin"
                      className="flex items-center gap-4 p-4 bg-[#c9a84c]/5 border border-[#c9a84c]/20 hover:border-[#c9a84c]/50 hover:shadow-sm rounded-xl transition-all"
                    >
                      <ShieldCheck size={22} className="text-[#c9a84c]" />
                      <div>
                        <p className="text-[#1c3320] font-medium text-sm">Admin Panel</p>
                        <p className="text-[#1c3320]/40 text-xs">Manage orders &amp; exports</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {tab === "orders" && (
              <div className="bg-white border border-[#c5e0cc] rounded-xl p-6">
                <h2
                  className="text-xl font-semibold text-[#1c3320] mb-6"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  Order History
                </h2>
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-[#2d6e3e]" size={28} />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={36} className="text-[#1c3320]/20 mx-auto mb-4" />
                    <p className="text-[#1c3320]/50 text-sm">No orders yet.</p>
                    <a
                      href="/order"
                      className="inline-flex mt-4 px-5 py-2.5 bg-[#2d6e3e] hover:bg-[#245730] text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Place Your First Order
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
                      const isOpen = expandedOrder === order.id;
                      return (
                        <div key={order.id} className="border border-[#c5e0cc] rounded-xl overflow-hidden transition-colors hover:border-[#2d6e3e]/40">
                          {/* Header row — clickable */}
                          <button
                            className="w-full text-left p-4"
                            onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <ChevronDown size={15} className={`text-[#1c3320]/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                <div>
                                  <p className="text-[#2d6e3e] font-mono font-semibold text-sm">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                  </p>
                                  <p className="text-[#1c3320]/40 text-xs mt-0.5">
                                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                                      day: "numeric", month: "long", year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: `${statusInfo.color}18`, color: statusInfo.color }}
                                >
                                  {statusInfo.label}
                                </span>
                                <span className="text-[#2d6e3e] font-semibold text-sm">
                                  £{Number(order.total).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Expanded detail */}
                          {isOpen && (
                            <div className="border-t border-[#c5e0cc] bg-[#f9fdf9] px-4 pb-4 pt-3 space-y-3 text-sm">
                              {/* Items */}
                              <div>
                                <p className="text-[#2d6e3e] text-xs font-medium uppercase tracking-wider mb-2">Items</p>
                                <div className="space-y-1">
                                  {(order.order_items ?? []).map((item: { quantity: number; price_at_time: number; products?: { name?: string } }, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                      <span className="text-[#1c3320]/70">
                                        {item.products?.name ?? "Item"} × {item.quantity}
                                      </span>
                                      <span className="text-[#1c3320]">
                                        £{(item.price_at_time * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Totals */}
                              <div className="border-t border-[#c5e0cc] pt-2 space-y-1">
                                <div className="flex justify-between text-xs text-[#1c3320]/50">
                                  <span>Subtotal</span>
                                  <span>£{Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-[#1c3320]/50">
                                  <span>{order.delivery_method === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}</span>
                                  <span>£{Number(order.shipping_cost).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold text-[#2d6e3e] pt-1">
                                  <span>Total</span>
                                  <span>£{Number(order.total).toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Delivery info */}
                              {order.delivery_method === "delivery" && order.address_line1 && (
                                <div className="border-t border-[#c5e0cc] pt-2">
                                  <p className="text-[#2d6e3e] text-xs font-medium uppercase tracking-wider mb-1">Delivery Address</p>
                                  <p className="text-[#1c3320]/60 text-xs leading-relaxed">
                                    {[order.address_line1, order.address_line2, order.city, order.postcode].filter(Boolean).join(", ")}
                                  </p>
                                </div>
                              )}

                              {/* Payment status */}
                              <div className="border-t border-[#c5e0cc] pt-2 flex items-center justify-between">
                                <span className="text-[#1c3320]/40 text-xs">Payment</span>
                                <span className="text-[#1c3320]/60 text-xs capitalize">{order.payment_status}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "addresses" && (
              <div className="bg-white border border-[#c5e0cc] rounded-xl p-6">
                <h2
                  className="text-xl font-semibold text-[#1c3320] mb-4"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  Saved Addresses
                </h2>
                <p className="text-[#1c3320]/50 text-sm">
                  Addresses are saved with each order. Your most recent delivery
                  address will be pre-filled at checkout.
                </p>
              </div>
            )}

            {tab === "account" && (
              <div className="bg-white border border-[#c5e0cc] rounded-xl p-6">
                <h2
                  className="text-xl font-semibold text-[#1c3320] mb-6"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  Account Details
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-[#f2faf3] border border-[#c5e0cc] rounded-xl">
                    <p className="text-[#1c3320]/40 text-xs uppercase tracking-wider mb-1">Email</p>
                    <p className="text-[#1c3320] text-sm">{user.email}</p>
                  </div>
                  <div className="p-4 bg-[#f2faf3] border border-[#c5e0cc] rounded-xl">
                    <p className="text-[#1c3320]/40 text-xs uppercase tracking-wider mb-1">Member Since</p>
                    <p className="text-[#1c3320] text-sm">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("en-GB", {
                            month: "long",
                            year: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.auth.resetPasswordForEmail(user.email ?? "", {
                        redirectTo: `${window.location.origin}/my-account`,
                      });
                      alert("Password reset email sent. Check your inbox.");
                    }}
                    className="px-5 py-2.5 border border-[#c5e0cc] hover:border-[#2d6e3e]/50 text-[#1c3320]/70 hover:text-[#1c3320] text-sm font-medium rounded-xl transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
