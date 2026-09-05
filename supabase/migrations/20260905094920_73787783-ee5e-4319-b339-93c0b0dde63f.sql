-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2),
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- QUOTE REQUESTS
CREATE TYPE public.quote_status AS ENUM ('en_attente', 'devis_envoye', 'termine');

CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_label TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  status public.quote_status NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a quote" ON public.quote_requests FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Read own quotes or admin" ON public.quote_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update quotes" ON public.quote_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete quotes" ON public.quote_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- profile auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED
INSERT INTO public.products (brand, name, category, description, price, featured, in_stock) VALUES
('Canon', 'EOS R5 Mark II', 'Boîtiers', 'Boîtier hybride plein format 45 Mpx, vidéo 8K RAW et stabilisation 5 axes. La référence des photographes exigeants.', 4499.00, true, true),
('Sony', 'Alpha 7R V', 'Boîtiers', 'Capteur 61 Mpx, autofocus intelligent par IA et écran multi-angle. Le détail à l''état pur.', 3899.00, true, true),
('Nikon', 'Z9 Mark II', 'Boîtiers', 'Boîtier professionnel sans obturateur mécanique, rafale 20 i/s et vidéo 8K60.', 5799.00, true, true),
('Fujifilm', 'GFX 100S II', 'Moyen format', 'Moyen format 102 Mpx dans un gabarit compact. Rendu couleur Fujifilm légendaire.', 5299.00, false, true),
('Sony', 'FE 85mm f/1.4 GM', 'Objectifs', 'Portrait de référence, bokeh crémeux et piqué exceptionnel dès la pleine ouverture.', 1899.00, true, true),
('Canon', 'RF 24-70mm f/2.8L IS', 'Objectifs', 'Le zoom standard incontournable, stabilisé et tropicalisé.', 2599.00, false, true),
('Nikon', 'Z 14-24mm f/2.8 S', 'Objectifs', 'Ultra grand-angle pour l''architecture et le paysage, sans compromis optique.', 2399.00, false, false),
('Profoto', 'B10X Plus', 'Éclairage', 'Flash de studio portable 500 Ws, autonomie 200 éclairs pleine puissance.', 2199.00, false, true),
('Manfrotto', 'MT055 Carbone', 'Accessoires', 'Trépied carbone 4 sections, colonne centrale horizontale, charge 9 kg.', 549.00, false, true),
('DJI', 'RS 4 Pro', 'Accessoires', 'Stabilisateur 3 axes pour boîtiers hybrides lourds, suivi de sujet intelligent.', 999.00, false, true);

INSERT INTO public.quote_requests (product_id, product_label, full_name, email, quantity, message, status, created_at)
SELECT p.id, p.brand || ' ' || p.name, v.full_name, v.email, 1, v.message, v.status::public.quote_status, v.created_at::timestamptz
FROM (VALUES
  ('Sony Alpha 7R V', 'Sophie Martin', 'sophie@studio.fr', 'Bonjour, quel est le délai de livraison ?', 'en_attente', '2026-09-03'),
  ('Canon EOS R5 Mark II', 'Lucas Bernard', 'lucas@photo.com', 'Possibilité de reprise de mon ancien boîtier ?', 'devis_envoye', '2026-09-02'),
  ('Nikon Z9 Mark II', 'Emma Petit', 'emma@free.fr', 'Devis pour deux boîtiers svp.', 'termine', '2026-09-01'),
  ('Fujifilm GFX 100S II', 'Thomas Leroy', 'thomas@agence.fr', 'Location possible sur une semaine ?', 'en_attente', '2026-08-31'),
  ('Sony FE 85mm f/1.4 GM', 'Camille Dubois', 'camille@press.fr', 'Tarif presse disponible ?', 'devis_envoye', '2026-08-30')
) AS v(label, full_name, email, message, status, created_at)
JOIN public.products p ON p.brand || ' ' || p.name = v.label;