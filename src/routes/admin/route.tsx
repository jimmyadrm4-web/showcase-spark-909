import { useState } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Aperture,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/produits", label: "Produits", icon: Package },
  { to: "/admin/devis", label: "Devis", icon: FileText },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobile = () => setIsMobileOpen(false);

  const renderNavContent = () => (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <Aperture className="size-5 text-primary" strokeWidth={1.6} />
        <span className="font-display text-base font-semibold tracking-tight text-sidebar-foreground">
          Optique<span className="text-primary">Pro</span>
        </span>
        <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={closeMobile}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-primary/15 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={isActive ? 2 : 1.6} />
              {label}
              {isActive && (
                <ChevronRight className="ml-auto size-3.5 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/"
          onClick={closeMobile}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
        >
          <Aperture className="size-4 shrink-0" strokeWidth={1.6} />
          Voir la vitrine
        </Link>
        <button
          onClick={async () => {
            closeMobile();
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive transition-all"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.6} />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-sidebar px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Aperture className="size-5 text-primary" strokeWidth={1.6} />
          <span className="font-display text-base font-semibold tracking-tight text-sidebar-foreground">
            Optique<span className="text-primary">Pro</span>
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Admin
          </span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Administration</SheetTitle>
            </SheetHeader>
            {renderNavContent()}
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-border bg-sidebar md:flex">
        {renderNavContent()}
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

