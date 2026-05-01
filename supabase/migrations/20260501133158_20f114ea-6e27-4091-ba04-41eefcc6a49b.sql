
-- ============================================================
-- 1. PERMISSIONS CATALOG
-- ============================================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_permissions_group ON public.permissions(group_name);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_read_authenticated"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "permissions_admin_write"
  ON public.permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. ROLE -> PERMISSIONS MAPPING
-- ============================================================
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission_key)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_key ON public.role_permissions(permission_key);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_read_authenticated"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "role_permissions_admin_write"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 3. has_permission() — server-side permission check
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND rp.permission_key = _permission_key
  )
  OR public.has_role(_user_id, 'admin'::app_role)
$$;

-- ============================================================
-- 4. SEED PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (key, label, group_name, description) VALUES
  ('products.read',        'عرض المنتجات',        'products',    'استعراض كتالوج المنتجات'),
  ('products.write',       'تعديل المنتجات',      'products',    'إنشاء وتعديل المنتجات والأسعار'),
  ('products.delete',      'حذف المنتجات',        'products',    'حذف منتجات من الكتالوج'),
  ('inventory.read',       'عرض المخزون',         'inventory',   'استعراض حالة المخزون'),
  ('inventory.adjust',     'تعديل المخزون',       'inventory',   'إجراء تسويات المخزون والجرد'),
  ('orders.read',          'عرض الطلبات',         'orders',      'استعراض الطلبات وتفاصيلها'),
  ('orders.manage',        'إدارة الطلبات',       'orders',      'تغيير حالة الطلبات وإلغائها'),
  ('orders.fulfill',       'تجهيز الطلبات',       'orders',      'تجهيز وتسليم الطلبات للمندوب'),
  ('finance.read',         'عرض المالية',         'finance',     'الاطلاع على التقارير المالية'),
  ('finance.approve',      'اعتماد العمليات',     'finance',     'اعتماد الشحن والصرف وكشوف التسوية'),
  ('wallet.topup',         'شحن المحافظ',         'finance',     'إنشاء طلبات شحن محفظة العميل'),
  ('wallet.approve',       'اعتماد الشحن',        'finance',     'الموافقة النهائية على شحن المحافظ'),
  ('delivery.assign',      'إسناد المناديب',      'fulfillment', 'إسناد الطلبات إلى المناديب'),
  ('delivery.execute',     'تنفيذ التوصيل',       'fulfillment', 'استلام مهام التوصيل وتنفيذها'),
  ('customers.read',       'عرض العملاء',         'customers',   'استعراض ملفات العملاء'),
  ('customers.manage',     'إدارة العملاء',       'customers',   'تعديل بيانات العملاء وحالة KYC'),
  ('admin.settings',       'إعدادات النظام',      'admin',       'الوصول إلى إعدادات المنصة العامة'),
  ('admin.staff',          'إدارة الموظفين',      'admin',       'إضافة وإدارة الأدوار والموظفين');

-- ============================================================
-- 5. SEED ROLE -> PERMISSION ASSIGNMENTS
-- ============================================================
-- store_manager
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('store_manager','products.read'), ('store_manager','products.write'),
  ('store_manager','inventory.read'), ('store_manager','inventory.adjust'),
  ('store_manager','orders.read'), ('store_manager','orders.manage'), ('store_manager','orders.fulfill'),
  ('store_manager','finance.read'), ('store_manager','wallet.topup'),
  ('store_manager','delivery.assign'),
  ('store_manager','customers.read'), ('store_manager','customers.manage');

-- finance
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('finance','finance.read'), ('finance','finance.approve'),
  ('finance','wallet.topup'), ('finance','wallet.approve'),
  ('finance','orders.read'), ('finance','customers.read');

-- branch_manager
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('branch_manager','products.read'), ('branch_manager','inventory.read'), ('branch_manager','inventory.adjust'),
  ('branch_manager','orders.read'), ('branch_manager','orders.manage'), ('branch_manager','orders.fulfill'),
  ('branch_manager','delivery.assign'), ('branch_manager','customers.read');

-- inventory_clerk
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('inventory_clerk','products.read'), ('inventory_clerk','inventory.read'), ('inventory_clerk','inventory.adjust');

-- cashier
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('cashier','products.read'), ('cashier','orders.read'), ('cashier','orders.manage'),
  ('cashier','customers.read'), ('cashier','wallet.topup');

-- delivery
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('delivery','delivery.execute'), ('delivery','orders.read');

-- vendor
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('vendor','products.read'), ('vendor','products.write'),
  ('vendor','inventory.read'), ('vendor','inventory.adjust'),
  ('vendor','orders.read'), ('vendor','orders.fulfill');

-- staff
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('staff','products.read'), ('staff','orders.read'), ('staff','customers.read');

-- collector
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('collector','orders.read'), ('collector','wallet.topup');

-- admin gets implicit all-access via has_permission() short-circuit; no rows needed.

-- ============================================================
-- 6. GEO ZONES
-- ============================================================
CREATE TABLE public.geo_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  districts TEXT[] NOT NULL DEFAULT '{}',
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_delivery_threshold NUMERIC(10,2),
  min_order_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  eta_label TEXT NOT NULL DEFAULT '',
  eta_minutes INT,
  cod_allowed BOOLEAN NOT NULL DEFAULT true,
  accepts_perishables BOOLEAN NOT NULL DEFAULT true,
  accent TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  polygon JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_zones_active ON public.geo_zones(is_active, sort_order);

ALTER TABLE public.geo_zones ENABLE ROW LEVEL SECURITY;

-- Public read: storefront needs zones before login (delivery fee preview).
CREATE POLICY "geo_zones_read_public"
  ON public.geo_zones FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "geo_zones_admin_write"
  ON public.geo_zones FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_geo_zones_updated_at
  BEFORE UPDATE ON public.geo_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed from src/lib/geoZones.ts
INSERT INTO public.geo_zones
  (zone_code, name, short_name, districts, delivery_fee, free_delivery_threshold,
   eta_label, eta_minutes, cod_allowed, accepts_perishables, accent, sort_order)
VALUES
  ('A', 'جمصة', 'جمصة (السريع)',
   ARRAY['الصفا','المروة','جمصة غرب','جمصة شرق','شجرة الدر'],
   25, 300, 'خلال ساعة', 60, true, true, 'text-emerald-600', 1),
  ('B', 'جمصة الموسعة', 'جمصة الموسعة',
   ARRAY['العاشر','15 مايو','جمصة 1','جمصة 2','جمصة 3','جمصة 4'],
   30, 500, 'خلال ساعتين', 120, true, true, 'text-emerald-600', 2),
  ('C', 'دمياط الجديدة', 'دمياط الجديدة',
   ARRAY['الحي الأول','الحي الثاني','الحي الثالث','الحي الرابع','الحي الخامس','الحي السادس','الـ 60','الـ 70','النوعية','الصناعية'],
   35, 700, '3 أيام في الأسبوع', NULL, false, true, 'text-amber-600', 3),
  ('M', 'المنصورة الجديدة', 'المنصورة الجديدة',
   ARRAY['الحي الأول','الحي الثاني','الحي الثالث','الحي الرابع'],
   40, 700, 'خلال 24 ساعة', 1440, true, true, 'text-amber-600', 4),
  ('D', 'قرى دمياط', 'قرى دمياط',
   ARRAY['الركابية','الوسطاني','كفر الغاب'],
   35, 700, 'اليوم التالي', 1440, false, true, 'text-orange-600', 5),
  ('E', 'باقي محافظات مصر', 'محافظات أخرى',
   ARRAY[]::TEXT[],
   70, NULL, '3 إلى 7 أيام', NULL, false, false, 'text-sky-600', 6);
