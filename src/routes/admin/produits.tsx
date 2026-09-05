import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  PackageCheck,
  PackageX,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, productImage, type Product, categoryList } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/produits")({
  head: () => ({ meta: [{ title: "Produits — Administration OptiquePro" }] }),
  component: AdminProduits,
});

type ProductForm = {
  brand: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image_url: string;
  featured: boolean;
  in_stock: boolean;
};

const emptyForm: ProductForm = {
  brand: "",
  name: "",
  category: categoryList[0] ?? "Boîtiers",
  description: "",
  price: "",
  image_url: "",
  featured: false,
  in_stock: true,
};

function productToForm(p: Product): ProductForm {
  return {
    brand: p.brand,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price != null ? String(p.price) : "",
    image_url: p.image_url ?? "",
    featured: p.featured,
    in_stock: p.in_stock,
  };
}

function AdminProduits() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: {
      id?: string;
      brand: string;
      name: string;
      category: string;
      description: string;
      price: number | null;
      image_url: string | null;
      featured: boolean;
      in_stock: boolean;
    }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Produit enregistré.");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produit supprimé.");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setForm(emptyForm);
    setEditingId("new");
  }

  function openEdit(p: Product) {
    setForm(productToForm(p));
    setEditingId(p.id);
  }

  function closePanel() {
    setEditingId(null);
  }

  function handleSave() {
    const payload = {
      brand: form.brand.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price: form.price !== "" ? parseFloat(form.price) : null,
      image_url: form.image_url.trim() || null,
      featured: form.featured,
      in_stock: form.in_stock,
    };
    if (!payload.brand || !payload.name) {
      toast.error("La marque et le nom sont obligatoires.");
      return;
    }
    upsert.mutate(editingId === "new" ? payload : { ...payload, id: editingId! });
  }

  const filtered = products.filter((p) => {
    const t = `${p.brand} ${p.name} ${p.category}`.toLowerCase();
    return t.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List */}
      <div className={`flex flex-1 flex-col overflow-hidden transition-all ${editingId ? "lg:w-[55%]" : "w-full"}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-8">
            <div className="flex-1">
              <p className="eyebrow">Catalogue</p>
              <h1 className="font-display text-xl font-semibold leading-tight">
                Gestion des produits
              </h1>
            </div>
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={openNew} size="sm" id="btn-add-product">
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun produit trouvé.</p>
          ) : (
            <div className="surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Produit</th>
                    <th className="hidden px-4 py-3 md:table-cell">Catégorie</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Prix</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Vedette</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-accent/30 ${editingId === p.id ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage(p)}
                            alt=""
                            className="size-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium leading-tight">{p.brand}</p>
                            <p className="text-xs text-muted-foreground">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {p.category}
                      </td>
                      <td className="hidden px-4 py-3 font-medium lg:table-cell">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.in_stock ? (
                          <PackageCheck className="mx-auto size-4 text-success" />
                        ) : (
                          <PackageX className="mx-auto size-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.featured ? (
                          <Star className="mx-auto size-4 fill-primary text-primary" />
                        ) : (
                          <Star className="mx-auto size-4 text-muted-foreground/30" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(p)}
                            id={`btn-edit-${p.id}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Supprimer "${p.brand} ${p.name}" ?`))
                                remove.mutate(p.id);
                            }}
                            id={`btn-delete-${p.id}`}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
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

      {/* Edit Panel */}
      {editingId !== null && (
        <aside className="flex w-full max-w-sm flex-col border-l border-border bg-sidebar overflow-y-auto lg:flex-shrink-0">
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
            <h2 className="font-semibold">
              {editingId === "new" ? "Nouveau produit" : "Modifier le produit"}
            </h2>
            <Button variant="ghost" size="sm" onClick={closePanel}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="form-brand">Marque *</Label>
                <Input
                  id="form-brand"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="form-name">Modèle *</Label>
                <Input
                  id="form-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="form-category">Catégorie</Label>
              <select
                id="form-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categoryList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="form-price">Prix indicatif (€)</Label>
              <Input
                id="form-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="Sur devis si vide"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="form-image">URL image (optionnel)</Label>
              <Input
                id="form-image"
                placeholder="https://…"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="form-stock" className="cursor-pointer">
                En stock
              </Label>
              <button
                id="form-stock"
                type="button"
                onClick={() => setForm({ ...form, in_stock: !form.in_stock })}
                className={`relative h-5 w-9 rounded-full transition-colors ${form.in_stock ? "bg-success" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${form.in_stock ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="form-featured" className="cursor-pointer">
                Mis en avant
              </Label>
              <button
                id="form-featured"
                type="button"
                onClick={() => setForm({ ...form, featured: !form.featured })}
                className={`relative h-5 w-9 rounded-full transition-colors ${form.featured ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </div>
          </div>

          <div className="border-t border-sidebar-border p-4">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={upsert.isPending}
              id="btn-save-product"
            >
              <Check className="size-4" />
              {upsert.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}
