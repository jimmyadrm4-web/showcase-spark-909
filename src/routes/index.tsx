import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { categoryList, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OptiquePro — Vitrine de matériel photo professionnel" },
      {
        name: "description",
        content:
          "Boîtiers, objectifs, éclairage et accessoires haut de gamme. Consultez le catalogue OptiquePro et demandez un devis personnalisé en quelques minutes.",
      },
      { property: "og:title", content: "OptiquePro — Matériel photo professionnel" },
      {
        property: "og:description",
        content:
          "Catalogue vitrine de matériel photo et vidéo professionnel avec demande de devis en ligne.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: featured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at")
        .limit(4);
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <img
            src={heroImage}
            alt="Boîtier photo professionnel éclairé en lumière ambrée"
            width={1920}
            height={1080}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/90 to-background/30" />
          <div className="relative mx-auto max-w-6xl px-5 py-28 md:py-36">
            <p className="eyebrow">Distributeur pro depuis 2011</p>
            <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] font-semibold md:text-6xl">
              Le matériel des <span className="text-gradient">photographes</span> qui
              vivent de leur image
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Une sélection resserrée de boîtiers, optiques et éclairages
              professionnels. Pas de panier : vous choisissez, nous chiffrons.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/produits">
                  Explorer le catalogue <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#services">Nos services</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: PackageCheck,
                title: "Devis sous 24 h",
                text: "Chaque demande est étudiée par un conseiller, tarif dégressif selon les volumes.",
              },
              {
                icon: ShieldCheck,
                title: "Garantie pro 3 ans",
                text: "Extension de garantie et prêt de matériel pendant les réparations.",
              },
              {
                icon: Truck,
                title: "Livraison assurée",
                text: "Expédition sécurisée en 48 h en France et en Europe.",
              },
            ].map((item) => (
              <div key={item.title} className="surface p-6">
                <item.icon className="size-6 text-primary" strokeWidth={1.6} />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Sélection</p>
              <h2 className="mt-2 text-3xl font-semibold">Pièces mises en avant</h2>
            </div>
            <Link
              to="/produits"
              className="text-sm text-primary transition-opacity hover:opacity-80"
            >
              Voir tout →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="surface flex flex-wrap items-center justify-between gap-6 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Parcourir par catégorie</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {categoryList.join(" · ")}
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/produits">Ouvrir le catalogue</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
