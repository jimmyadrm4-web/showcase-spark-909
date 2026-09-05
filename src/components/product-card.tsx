import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, productImage, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produits/$id"
      params={{ id: product.id }}
      className="surface group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-secondary">
        <img
          src={productImage(product)}
          alt={`${product.brand} ${product.name}`}
          loading="lazy"
          width={1024}
          height={1024}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs text-muted-foreground">
            Sur commande
          </span>
        )}
      </div>
      <div className="space-y-2 p-5">
        <p className="eyebrow">{product.brand}</p>
        <h3 className="text-base font-semibold leading-tight">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-lg">{formatPrice(product.price)}</span>
          <ArrowUpRight className="size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
