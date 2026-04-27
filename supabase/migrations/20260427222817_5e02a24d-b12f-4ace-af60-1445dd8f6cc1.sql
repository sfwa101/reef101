
UPDATE auth.users
SET
  email = '201055846000@reef.local',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  encrypted_password = crypt('Fatema@101710', gen_salt('bf')),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('phone', '201055846000', 'full_name', 'مدير النظام'),
  updated_at = now()
WHERE id = '0cf7674a-d133-4ab6-af7b-b9dfc02ab723';

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  '0cf7674a-d133-4ab6-af7b-b9dfc02ab723',
  jsonb_build_object('sub', '0cf7674a-d133-4ab6-af7b-b9dfc02ab723', 'email', '201055846000@reef.local', 'email_verified', true),
  'email',
  '201055846000@reef.local',
  now(), now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities
  WHERE user_id = '0cf7674a-d133-4ab6-af7b-b9dfc02ab723' AND provider = 'email'
);

INSERT INTO public.profiles (id, full_name, phone)
VALUES ('0cf7674a-d133-4ab6-af7b-b9dfc02ab723', 'مدير النظام', '201055846000')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

INSERT INTO public.user_roles (user_id, role)
VALUES ('0cf7674a-d133-4ab6-af7b-b9dfc02ab723', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.wallet_balances (user_id) VALUES ('0cf7674a-d133-4ab6-af7b-b9dfc02ab723')
ON CONFLICT DO NOTHING;
