import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  Mail,
  Phone,
  MessageSquare,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDate,
  statusLabels,
  type QuoteRequest,
  type QuoteStatus,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/devis")({
  head: () => ({ meta: [{ title: "Devis — Administration OptiquePro" }] }),
  component: AdminDevis,
});

const statusConfig: Record<
  QuoteStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  en_attente: {
    label: "En attente",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/20",
    icon: Clock,
  },
  devis_envoye: {
    label: "Devis envoyé",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    icon: Send,
  },
  termine: {
    label: "Terminé",
    color: "text-success",
    bg: "bg-success/10 border-success/20",
    icon: CheckCircle2,
  },
};

const ALL_STATUSES: (QuoteStatus | "all")[] = [
  "all",
  "en_attente",
  "devis_envoye",
  "termine",
];

function StatusBadge({ status }: { status: QuoteStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.color} ${cfg.bg}`}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function AdminDevis() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<QuoteRequest | null>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["admin", "quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as QuoteRequest[];
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: QuoteStatus }) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour.");
      qc.invalidateQueries({ queryKey: ["admin", "quotes"] });
      qc.invalidateQueries({ queryKey: ["my-quotes"] });
      // Update selected panel if open
      setSelected((prev) =>
        prev ? { ...prev, status: changeStatus.variables?.status ?? prev.status } : prev
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = quotes.filter((q) => {
    const matchStatus = filter === "all" || q.status === filter;
    const t = `${q.full_name} ${q.email} ${q.product_label}`.toLowerCase();
    const matchSearch = t.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: quotes.length,
    en_attente: quotes.filter((q) => q.status === "en_attente").length,
    devis_envoye: quotes.filter((q) => q.status === "devis_envoye").length,
    termine: quotes.filter((q) => q.status === "termine").length,
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-8">
            <div className="flex-1">
              <p className="eyebrow">Gestion</p>
              <h1 className="font-display text-xl font-semibold leading-tight">
                Suivi des devis
              </h1>
            </div>
            <Input
              placeholder="Rechercher un client, un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 border-t border-border px-8 py-2">
            {ALL_STATUSES.map((s) => {
              const count = counts[s];
              const isActive = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "all" ? "Tout" : statusLabels[s]}
                  {count > 0 && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande trouvée.</p>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Client</th>
                    <th className="hidden px-4 py-3 md:table-cell">Produit</th>
                    <th className="hidden px-4 py-3 lg:table-cell text-center">Qté</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="hidden px-4 py-3 xl:table-cell">Date</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => setSelected(q)}
                      className={`cursor-pointer transition-colors hover:bg-accent/30 ${
                        selected?.id === q.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{q.full_name}</p>
                        <p className="text-xs text-muted-foreground">{q.email}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {q.product_label}
                      </td>
                      <td className="hidden px-4 py-3 text-center lg:table-cell">
                        {q.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                        {formatDate(q.created_at)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <select
                            value={q.status}
                            onChange={(e) =>
                              changeStatus.mutate({
                                id: q.id,
                                status: e.target.value as QuoteStatus,
                              })
                            }
                            className="h-8 appearance-none rounded-md border border-input bg-background px-2 pr-7 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="en_attente">En attente</option>
                            <option value="devis_envoye">Devis envoyé</option>
                            <option value="termine">Terminé</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <aside className="flex w-full max-w-xs flex-col border-l border-border bg-sidebar overflow-y-auto lg:flex-shrink-0">
          <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-5">
            <h2 className="font-semibold text-sm">Détail de la demande</h2>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <p className="eyebrow text-[10px]">Produit</p>
              <p className="mt-1.5 font-semibold">{selected.product_label}</p>
              <p className="text-sm text-muted-foreground">
                Quantité : {selected.quantity}
              </p>
            </div>

            <div>
              <p className="eyebrow text-[10px]">Client</p>
              <p className="mt-1.5 font-semibold">{selected.full_name}</p>
              <div className="mt-2 space-y-1.5">
                <a
                  href={`mailto:${selected.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="size-3.5 shrink-0" />
                  {selected.email}
                </a>
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="size-3.5 shrink-0" />
                    {selected.phone}
                  </a>
                )}
              </div>
            </div>

            {selected.message && (
              <div>
                <p className="eyebrow text-[10px]">Message</p>
                <div className="mt-1.5 flex gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{selected.message}</p>
                </div>
              </div>
            )}

            <div>
              <p className="eyebrow text-[10px]">Statut actuel</p>
              <div className="mt-1.5">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div>
              <p className="eyebrow text-[10px]">Date</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {new Date(selected.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="border-t border-sidebar-border p-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Changer le statut :</p>
            {(["en_attente", "devis_envoye", "termine"] as QuoteStatus[]).map(
              (s) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                const isActive = selected.status === s;
                return (
                  <button
                    key={s}
                    disabled={isActive || changeStatus.isPending}
                    onClick={() => {
                      changeStatus.mutate({ id: selected.id, status: s });
                      setSelected({ ...selected, status: s });
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                      isActive
                        ? `${cfg.bg} ${cfg.color} font-medium`
                        : "border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {cfg.label}
                    {isActive && <Check className="ml-auto size-3.5" />}
                  </button>
                );
              }
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
