import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, type QuoteRequest } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/mes-devis")({
  head: () => ({
    meta: [
      { title: "Mes demandes de devis — OptiquePro" },
      {
        name: "description",
        content:
          "Suivez l'avancement de vos demandes de devis de matériel photo professionnel chez OptiquePro.",
      },
      { property: "og:title", content: "Mes devis OptiquePro" },
      { property: "og:description", content: "Suivi de vos demandes de devis." },
    ],
  }),
  component: MyQuotes,
});

function MyQuotes() {
  const { data: quotes } = useQuery({
    queryKey: ["my-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuoteRequest[];
    },
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="eyebrow">Espace client</p>
        <h1 className="mt-2 text-3xl font-semibold">Mes demandes de devis</h1>

        <div className="mt-8 space-y-3">
          {quotes?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Vous n'avez encore envoyé aucune demande.
            </p>
          )}
          {quotes?.map((quote) => (
            <div
              key={quote.id}
              className="surface flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div>
                <p className="font-medium">{quote.product_label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quantité {quote.quantity} · envoyé le {formatDate(quote.created_at)}
                </p>
              </div>
              <StatusBadge status={quote.status} />
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
