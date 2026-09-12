import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Aperture, LogOut, Menu, ShieldCheck, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center gap-2">
          <Aperture className="size-6 text-primary" strokeWidth={1.6} />
          <span className="font-display text-lg font-semibold tracking-tight">
            Optique<span className="text-primary">Pro</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
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

        {/* Mobile Navigation Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Ouvrir le menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col justify-between w-[300px] sm:w-[350px]">
              <div className="flex flex-col gap-6 py-4">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <Aperture className="size-5 text-primary" strokeWidth={1.6} />
                    <span className="font-display text-base font-semibold tracking-tight">
                      Optique<span className="text-primary">Pro</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-4 text-base font-medium">
                  <Link
                    to="/"
                    onClick={closeMenu}
                    className="flex items-center py-2 text-foreground/80 hover:text-foreground transition-colors"
                  >
                    Accueil
                  </Link>
                  <Link
                    to="/produits"
                    onClick={closeMenu}
                    className="flex items-center py-2 text-foreground/80 hover:text-foreground transition-colors"
                  >
                    Catalogue
                  </Link>
                  <a
                    href="/#services"
                    onClick={closeMenu}
                    className="flex items-center py-2 text-foreground/80 hover:text-foreground transition-colors"
                  >
                    Services
                  </a>
                  <a
                    href="/#contact"
                    onClick={closeMenu}
                    className="flex items-center py-2 text-foreground/80 hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </nav>
              </div>

              <div className="border-t border-border pt-4 flex flex-col gap-3 pb-4">
                {user ? (
                  <>
                    {isAdmin && (
                      <Button asChild variant="outline" className="w-full justify-start gap-2" onClick={closeMenu}>
                        <Link to="/admin">
                          <ShieldCheck className="size-4" /> Administration
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full justify-start gap-2" onClick={closeMenu}>
                      <Link to="/mes-devis">
                        <User2 className="size-4" /> Mes devis
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={async () => {
                        closeMenu();
                        await supabase.auth.signOut();
                        navigate({ to: "/" });
                      }}
                    >
                      <LogOut className="size-4" /> Déconnexion
                    </Button>
                  </>
                ) : (
                  <Button asChild className="w-full justify-center" onClick={closeMenu}>
                    <Link to="/auth">Se connecter</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

