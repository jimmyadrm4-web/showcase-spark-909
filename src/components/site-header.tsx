import { Link, useNavigate } from "@tanstack/react-router";
import { Aperture, LogOut, ShieldCheck, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center gap-2">
          <Aperture className="size-6 text-primary" strokeWidth={1.6} />
          <span className="font-display text-lg font-semibold tracking-tight">
            Optique<span className="text-primary">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground">
            Accueil
          </Link>
          <Link to="/produits" className="transition-colors hover:text-foreground">
            Catalogue
          </Link>
          <a href="/#services" className="transition-colors hover:text-foreground">
            Services
          </a>
          <a href="/#contact" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" /> Administration
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/mes-devis">
                  <User2 className="size-4" /> Mes devis
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Se connecter</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
