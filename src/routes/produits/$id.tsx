import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, productImage, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/produits/$id")({
  head: () => ({
    meta: [
      { title: "Fiche produit — OptiquePro" },
      {
        name: "description",
        content:
          "Caractéristiques, prix indicatif et demande de devis pour ce matériel photo professionnel distribué par OptiquePro.",
      },
      { property: "og:title", content: "Fiche produit OptiquePro" },
      {
        property: "og:description",
        content: "Détail du matériel et demande de devis personnalisée.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  async function submitQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const { error } = await supabase.from("quote_requests").insert({
      user_id: user?.id ?? null,
      product_id: product.id,
      product_label: `${product.brand} ${product.name}`,
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || null,
      quantity: Number(form.get("quantity") ?? 1),
      message: String(form.get("message") ?? "") || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Envoi impossible : " + error.message);
      return;
    }
    setSent(true);
    toast.success("Demande envoyée, nous revenons vers vous sous 24 h.");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <Link
          to="/produits"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Retour au catalogue
        </Link>

        {isLoading ? (
          <p className="mt-12 text-sm text-muted-foreground">Chargement…</p>
        ) : !product ? (
          <p className="mt-12 text-sm text-muted-foreground">Ce produit n'existe pas.</p>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <div className="surface overflow-hidden">
              <img
                src={productImage(product)}
                alt={`${product.brand} ${product.name}`}
                width={1024}
                height={1024}
                className="size-full object-cover"
              />
            </div>

            <div>
              <p className="eyebrow">
                {product.brand} · {product.category}
              </p>
              <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{product.name}</h1>
              <p className="mt-4 text-muted-foreground">{product.description}</p>
              <p className="mt-6 font-display text-3xl">{formatPrice(product.price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prix indicatif TTC · {product.in_stock ? "En stock" : "Sur commande"}
              </p>

              <div className="surface mt-8 p-6">
                <h2 className="text-lg font-semibold">Demander un devis</h2>
                {sent ? (
                  <div className="mt-4 flex items-start gap-3 rounded-lg bg-success/10 p-4 text-sm text-success">
                    <Check className="mt-0.5 size-4" />
                    <p>
                      Votre demande est enregistrée. Un conseiller vous répond sous 24 h
                      ouvrées.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submitQuote} className="mt-4 grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="full_name">Nom complet</Label>
                        <Input id="full_name" name="full_name" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          defaultValue={user?.email ?? ""}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" name="phone" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantité</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min={1}
                          defaultValue={1}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={3}
                        placeholder="Précisez votre usage, votre délai…"
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Envoi…" : "Envoyer la demande"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
