-- 1. Alter addresses table to add coordinates
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6) NULL;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6) NULL;

-- 2. Alter orders table to record chosen shipping method
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method TEXT NULL;

-- 3. Create shipping_configs table
CREATE TABLE IF NOT EXISTS public.shipping_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_lat NUMERIC(9,6) NOT NULL DEFAULT -6.7027,
  store_lng NUMERIC(9,6) NOT NULL DEFAULT 107.5645,
  local_delivery_active BOOLEAN NOT NULL DEFAULT true,
  cod_active BOOLEAN NOT NULL DEFAULT true,
  cod_min_purchase BIGINT NOT NULL DEFAULT 50000,
  zone_shipping_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on shipping_configs
ALTER TABLE public.shipping_configs ENABLE ROW LEVEL SECURITY;

-- 4. Create shipping_zones table
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provinces TEXT[] NOT NULL,
  cost BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on shipping_zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- configs
DROP POLICY IF EXISTS "Anyone can view shipping configs" ON public.shipping_configs;
CREATE POLICY "Anyone can view shipping configs" 
  ON public.shipping_configs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage shipping configs" ON public.shipping_configs;
CREATE POLICY "Admins can manage shipping configs" 
  ON public.shipping_configs FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- zones
DROP POLICY IF EXISTS "Anyone can view shipping zones" ON public.shipping_zones;
CREATE POLICY "Anyone can view shipping zones" 
  ON public.shipping_zones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can manage shipping zones" 
  ON public.shipping_zones FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 6. Seed default config (if empty)
INSERT INTO public.shipping_configs (store_lat, store_lng, local_delivery_active, cod_active, cod_min_purchase, zone_shipping_active)
SELECT -6.7027, 107.5645, true, true, 50000, true
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_configs);

-- 7. Seed default shipping zones (if empty)
INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Jawa Barat', ARRAY['Jawa Barat'], 15000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Jawa Barat');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Jabodetabek & Banten', ARRAY['DKI Jakarta', 'Banten'], 20000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Jabodetabek & Banten');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Jawa Tengah & DIY', ARRAY['Jawa Tengah', 'DI Yogyakarta'], 25000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Jawa Tengah & DIY');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Jawa Timur', ARRAY['Jawa Timur'], 28000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Jawa Timur');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Sumatera', ARRAY['Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Lampung'], 32000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Sumatera');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Bali & Nusa Tenggara', ARRAY['Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur'], 35000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Bali & Nusa Tenggara');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Kalimantan & Sulawesi', ARRAY['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat'], 40000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Kalimantan & Sulawesi');

INSERT INTO public.shipping_zones (name, provinces, cost)
SELECT 'Maluku & Papua', ARRAY['Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'], 55000
WHERE NOT EXISTS (SELECT 1 FROM public.shipping_zones WHERE name = 'Maluku & Papua');
