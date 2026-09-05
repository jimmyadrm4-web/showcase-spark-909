import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace client — OptiquePro" },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace OptiquePro pour suivre vos demandes de devis de matériel photo professionnel.",
      },
      { property: "og:title", content: "Espace client OptiquePro" },
      {
        property: "og:description",
        content: "Connexion et création de compte pour suivre vos devis.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setLoading(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: String(form.get("full_name") ?? "") },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setPendingEmail(email);
        return;
      }
      navigate({ to: "/" });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Identifiants incorrects.");
      return;
    }
    navigate({ to: "/" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Connexion Google indisponible.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2">
          <Aperture className="size-6 text-primary" strokeWidth={1.6} />
          <span className="font-display text-lg font-semibold">
            Optique<span className="text-primary">Pro</span>
          </span>
        </Link>

        <div className="surface mt-8 p-7">
          {pendingEmail ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold">Vérifiez votre boîte mail</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Un lien de confirmation a été envoyé à {pendingEmail}. Cliquez dessus
                pour activer votre compte.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold">
                {mode === "signin" ? "Connexion" : "Créer un compte"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Suivez vos demandes de devis en un seul endroit.
              </p>

              <Button variant="outline" className="mt-6 w-full" onClick={google}>
                Continuer avec Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                {mode === "signup" && (
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input id="full_name" name="full_name" required />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Un instant…"
                    : mode === "signin"
                      ? "Se connecter"
                      : "Créer mon compte"}
                </Button>
              </form>

              <button
                type="button"
                className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin"
                  ? "Pas encore de compte ? Inscrivez-vous"
                  : "Déjà client ? Connectez-vous"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
