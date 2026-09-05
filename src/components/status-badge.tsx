import { statusLabels, type QuoteStatus } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const styles: Record<QuoteStatus, string> = {
  en_attente: "bg-warning/15 text-warning border-warning/30",
  devis_envoye: "bg-primary/15 text-primary border-primary/30",
  termine: "bg-success/15 text-success border-success/30",
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
