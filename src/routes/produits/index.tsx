import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/catalog";

export const Route = createFileRoute("/produits/")({
  head: () => ({
    meta: [
      { title: "Catalogue matériel photo pro — OptiquePro" },
      {
        name: "description",
        content:
          "Parcourez les boîtiers, objectifs, éclairages et accessoires professionnels distribués par OptiquePro et demandez votre devis.",
      },
      { property: "og:title", content: "Catalogue OptiquePro" },
      {
        property: "og:description",
        content: "Boîtiers, objectifs, éclairage et accessoires photo professionnels.",
      },
    ],
  }),
  component: Catalogue,
});

function Catalogue() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("brand");
      if (error) throw error;
      return data as Product[];
    },
  });

  const categories = [...new Set((products ?? []).map((p) => p.category))];
  const filtered = (products ?? []).filter((p) => {
    const matchesCategory = !category || p.category === category;
    const text = `${p.brand} ${p.name} ${p.description}`.toLowerCase();
    return matchesCategory && text.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-14">
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-2 text-4xl font-semibold">Tout le matériel</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Les prix affichés sont indicatifs. Envoyez une demande de devis pour un
          tarif adapté à votre projet.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une marque, un modèle…"
            className="max-w-xs"
          />
          <Button
            variant={category === null ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(null)}
          >
            Tout
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <p className="mt-12 text-sm text-muted-foreground">Chargement du catalogue…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-12 text-sm text-muted-foreground">Aucun produit ne correspond.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
