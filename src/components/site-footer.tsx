import { Link } from "@tanstack/react-router";
import { Aperture } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-border/70 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Aperture className="size-5 text-primary" strokeWidth={1.6} />
            <span className="font-display text-base font-semibold">OptiquePro</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Distributeur de matériel photo et vidéo professionnel. Catalogue en
            vitrine, tarification personnalisée sur demande de devis.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Navigation</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/produits" className="hover:text-foreground">
                Catalogue
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Espace client
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">Nous joindre</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>contact@optiquepro.example</li>
            <li>Lyon, France</li>
            <li>Du lundi au vendredi, 9h – 18h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OptiquePro. Coordonnées de démonstration.
      </div>
    </footer>
  );
}
