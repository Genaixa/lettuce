import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getSupabaseClient } from "@/lib/supabase";
import type { Product } from "@/types";

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return [];
    return data;
  } catch {
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getProducts();

  if (!products.length) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[#2d6e3e] text-sm font-medium tracking-widest uppercase mb-3">
          Our Selection
        </p>
        <h2
          className="text-3xl sm:text-4xl font-bold text-[#1c3320] mb-4"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Kosher Lettuce for Pesach
        </h2>
        <p className="text-[#1c3320]/70 max-w-xl mx-auto text-base leading-relaxed">
          Every head is individually inspected and certified. Order with
          confidence.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {products.map((product) => (
          <div key={product.id} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-72 flex">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/order"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#c9a84c] hover:bg-[#a8863a] text-[#1a1a1a] font-semibold rounded-xl text-base transition-all duration-200 shadow-lg hover:shadow-[#c9a84c]/30 hover:-translate-y-0.5"
        >
          View All Products & Pre-Order
        </Link>
      </div>
    </section>
  );
}
