-- Print jobs table
CREATE TABLE IF NOT EXISTS public.print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_path text,
  file_name text,
  pages integer NOT NULL DEFAULT 1,
  color_mode text NOT NULL DEFAULT 'bw',           -- 'bw' | 'color'
  sided text NOT NULL DEFAULT 'single',            -- 'single' | 'double'
  binding text NOT NULL DEFAULT 'none',            -- 'none' | 'spiral' | 'plastic' | 'thermal'
  copies integer NOT NULL DEFAULT 1,
  notes text,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',          -- pending | processing | ready | delivered | cancelled
  ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "print_jobs_select_own" ON public.print_jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "print_jobs_insert_own" ON public.print_jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "print_jobs_update_own" ON public.print_jobs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "print_jobs_admin_all" ON public.print_jobs
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER print_jobs_set_updated BEFORE UPDATE ON public.print_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('print-files', 'print-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "print_files_user_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'print-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "print_files_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'print-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "print_files_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'print-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "print_files_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'print-files' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'print-files' AND has_role(auth.uid(), 'admin'::app_role));