import boitier from "@/assets/boitier.jpg";
import objectif from "@/assets/objectif.jpg";
import eclairage from "@/assets/eclairage.jpg";
import accessoires from "@/assets/accessoires.jpg";
import moyenFormat from "@/assets/moyen-format.jpg";

export type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  description: string;
  price: number | null;
  image_url: string | null;
  featured: boolean;
  in_stock: boolean;
  created_at: string;
};

export type QuoteStatus = "en_attente" | "devis_envoye" | "termine";

export type QuoteRequest = {
  id: string;
  user_id: string | null;
  product_id: string | null;
  product_label: string;
  full_name: string;
  email: string;
  phone: string | null;
  quantity: number;
  message: string | null;
  status: QuoteStatus;
  created_at: string;
};

const categoryImages: Record<string, string> = {
  Boîtiers: boitier,
  Objectifs: objectif,
  Éclairage: eclairage,
  Accessoires: accessoires,
  "Moyen format": moyenFormat,
};

export function productImage(product: Pick<Product, "category" | "image_url">) {
  return product.image_url ?? categoryImages[product.category] ?? boitier;
}

export const categoryList = Object.keys(categoryImages);

export function formatPrice(price: number | null) {
  if (price == null) return "Sur devis";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(
    new Date(value),
  );
}

export const statusLabels: Record<QuoteStatus, string> = {
  en_attente: "En attente",
  devis_envoye: "Devis envoyé",
  termine: "Terminé",
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
