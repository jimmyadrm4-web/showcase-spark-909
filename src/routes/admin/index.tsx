import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Send,
  Euro,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, statusLabels, type QuoteRequest, type QuoteStatus } from "@/lib/catalog";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Administration — OptiquePro" }],
  }),
  component: AdminDashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string | undefined;
}) {
  return (
    <div className="surface p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className={`mt-3 font-display text-4xl font-semibold ${accent ?? ""}`}>
            {value}
          </p>
          {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="size-5 text-primary" strokeWidth={1.6} />
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: QuoteStatus }) {
  const colors: Record<QuoteStatus, string> = {
    en_attente: "bg-warning",
    devis_envoye: "bg-primary",
    termine: "bg-success",
  };
  return (
    <span className={`inline-block size-2 rounded-full ${colors[status]}`} />
  );
}

function AdminDashboard() {
  const { data: products } = useQuery({
    queryKey: ["admin", "products-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, price, in_stock");
      if (error) throw error;
      return data;
    },
  });

  const { data: quotes } = useQuery({
    queryKey: ["admin", "quotes-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuoteRequest[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin", "users-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id");
      if (error) throw error;
      return data;
    },
  });

  const totalProducts = products?.length ?? 0;
  const inStockProducts = products?.filter((p) => p.in_stock).length ?? 0;
  const totalQuotes = quotes?.length ?? 0;
  const pendingQuotes = quotes?.filter((q) => q.status === "en_attente").length ?? 0;
  const sentQuotes = quotes?.filter((q) => q.status === "devis_envoye").length ?? 0;
  const doneQuotes = quotes?.filter((q) => q.status === "termine").length ?? 0;
  const totalUsers = users?.length ?? 0;

  const recentQuotes = quotes?.slice(0, 8) ?? [];

  const statusDist = [
    { label: "En attente", count: pendingQuotes, color: "bg-warning", pct: totalQuotes ? (pendingQuotes / totalQuotes) * 100 : 0 },
    { label: "Devis envoyé", count: sentQuotes, color: "bg-primary", pct: totalQuotes ? (sentQuotes / totalQuotes) * 100 : 0 },
    { label: "Terminé", count: doneQuotes, color: "bg-success", pct: totalQuotes ? (doneQuotes / totalQuotes) * 100 : 0 },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-full items-center px-8">
          <div>
            <p className="eyebrow">Aperçu général</p>
            <h1 className="font-display text-xl font-semibold leading-tight">
              Tableau de bord
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-8 py-8">
        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Package}
            label="Produits"
            value={totalProducts}
            sub={`${inStockProducts} en stock`}
          />
          <StatCard
            icon={FileText}
            label="Demandes de devis"
            value={totalQuotes}
            sub={`${pendingQuotes} en attente`}
            accent={pendingQuotes > 0 ? "text-warning" : undefined}
          />
          <StatCard
            icon={Users}
            label="Utilisateurs"
            value={totalUsers}
          />
          <StatCard
            icon={TrendingUp}
            label="Taux de clôture"
            value={
              totalQuotes > 0
                ? `${Math.round((doneQuotes / totalQuotes) * 100)} %`
                : "—"
            }
            sub="devis terminés"
            accent="text-success"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Répartition des devis */}
          <div className="surface col-span-2 p-6">
            <p className="eyebrow">Pipeline</p>
            <h2 className="mt-2 text-lg font-semibold">Répartition des devis</h2>
            <div className="mt-6 space-y-4">
              {statusDist.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${s.color}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-3 divide-x divide-border text-center">
              {[
                { icon: Clock, label: "Attente", val: pendingQuotes, col: "text-warning" },
                { icon: Send, label: "Envoyé", val: sentQuotes, col: "text-primary" },
                { icon: CheckCircle2, label: "Terminé", val: doneQuotes, col: "text-success" },
              ].map(({ icon: Icon, label, val, col }) => (
                <div key={label} className="px-3 py-1">
                  <Icon className={`mx-auto size-4 ${col}`} strokeWidth={1.6} />
                  <p className={`mt-1 text-xl font-semibold ${col}`}>{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dernières demandes */}
          <div className="surface col-span-3 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Activité récente</p>
                <h2 className="mt-2 text-lg font-semibold">Dernières demandes</h2>
              </div>
            </div>
            <div className="mt-5 divide-y divide-border/50">
              {recentQuotes.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune demande pour le moment.
                </p>
              )}
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center gap-4 py-3">
                  <StatusDot status={q.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{q.product_label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {q.full_name} · {q.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {statusLabels[q.status]}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {formatDate(q.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Catalogue stats */}
        <div className="surface p-6">
          <p className="eyebrow">Catalogue</p>
          <h2 className="mt-2 text-lg font-semibold">État du stock</h2>
          <div className="mt-5 flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full bg-success inline-block" />
              <span className="text-muted-foreground">{inStockProducts} en stock</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full bg-warning inline-block" />
              <span className="text-muted-foreground">
                {totalProducts - inStockProducts} sur commande
              </span>
            </div>
            <div className="ml-auto">
              <div className="h-3 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{
                    width: totalProducts
                      ? `${(inStockProducts / totalProducts) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
