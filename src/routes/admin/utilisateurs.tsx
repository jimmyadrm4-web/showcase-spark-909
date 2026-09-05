import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  User2,
  Search,
  FileText,
  Shield,
  ShieldOff,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { initials, formatDate } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/utilisateurs")({
  head: () => ({
    meta: [{ title: "Utilisateurs — Administration OptiquePro" }],
  }),
  component: AdminUtilisateurs,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

type UserWithRole = Profile & {
  isAdmin: boolean;
  quoteCount: number;
};

function AdminUtilisateurs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "user">("all");

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data as { user_id: string; role: string }[];
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["admin", "quotes-by-user"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("user_id");
      if (error) throw error;
      return data as { user_id: string | null }[];
    },
  });

  // Build enriched user list
  const adminIds = new Set(roles.filter((r) => r.role === "admin").map((r) => r.user_id));
  const quoteCountByUser: Record<string, number> = {};
  for (const q of quotes) {
    if (q.user_id) quoteCountByUser[q.user_id] = (quoteCountByUser[q.user_id] ?? 0) + 1;
  }

  const users: UserWithRole[] = profiles.map((p) => ({
    ...p,
    isAdmin: adminIds.has(p.id),
    quoteCount: quoteCountByUser[p.id] ?? 0,
  }));

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, grant }: { userId: string; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: (_, { grant }) => {
      toast.success(grant ? "Rôle admin accordé." : "Rôle admin retiré.");
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = users.filter((u) => {
    const matchFilter =
      filter === "all" ||
      (filter === "admin" && u.isAdmin) ||
      (filter === "user" && !u.isAdmin);
    const t = `${u.full_name ?? ""} ${u.email ?? ""}`.toLowerCase();
    return matchFilter && t.includes(search.toLowerCase());
  });

  const adminCount = users.filter((u) => u.isAdmin).length;
  const userCount = users.filter((u) => !u.isAdmin).length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-8">
          <div className="flex-1">
            <p className="eyebrow">Gestion</p>
            <h1 className="font-display text-xl font-semibold leading-tight">
              Utilisateurs
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs pl-8"
            />
          </div>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 border-t border-border px-8 py-2">
          {[
            { key: "all", label: "Tous", count: users.length },
            { key: "admin", label: "Administrateurs", count: adminCount },
            { key: "user", label: "Clients", count: userCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as "all" | "admin" | "user")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === key
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-8 py-6">
        {[
          {
            label: "Total utilisateurs",
            value: users.length,
            icon: User2,
            color: "text-foreground",
          },
          {
            label: "Administrateurs",
            value: adminCount,
            icon: ShieldCheck,
            color: "text-primary",
          },
          {
            label: "Devis associés",
            value: quotes.filter((q) => q.user_id).length,
            icon: FileText,
            color: "text-muted-foreground",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="surface p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/8 p-2.5">
                <Icon className={`size-4 ${color}`} strokeWidth={1.6} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-2xl font-semibold">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {loadingProfiles ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="hidden px-4 py-3 md:table-cell">Email</th>
                  <th className="hidden px-4 py-3 lg:table-cell text-center">Devis</th>
                  <th className="hidden px-4 py-3 xl:table-cell">Inscrit le</th>
                  <th className="px-4 py-3 text-center">Rôle</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((u) => {
                  const name = u.full_name || "Sans nom";
                  const initial = initials(name) || "?";
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-accent/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-sm text-primary">
                            {initial}
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">
                              {u.email ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {u.email ? (
                          <a
                            href={`mailto:${u.email}`}
                            className="hover:text-foreground transition-colors"
                          >
                            {u.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-center lg:table-cell">
                        <span
                          className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                            u.quoteCount > 0
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.quoteCount}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 xl:table-cell">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" />
                          {formatDate(u.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20">
                            <ShieldCheck className="size-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground border border-border">
                            <User2 className="size-3" />
                            Client
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={toggleAdmin.isPending}
                          onClick={() =>
                            toggleAdmin.mutate({ userId: u.id, grant: !u.isAdmin })
                          }
                          id={`btn-role-${u.id}`}
                          className={`text-xs ${
                            u.isAdmin
                              ? "text-destructive hover:text-destructive"
                              : "text-muted-foreground"
                          }`}
                          title={u.isAdmin ? "Retirer admin" : "Accorder admin"}
                        >
                          {u.isAdmin ? (
                            <ShieldOff className="size-3.5" />
                          ) : (
                            <Shield className="size-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
