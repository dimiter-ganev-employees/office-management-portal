CREATE TABLE public.counterparty (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  phone text,
  contact_person text,
  active boolean NOT NULL DEFAULT true,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.counterparty TO anon, authenticated;
GRANT ALL ON public.counterparty TO service_role;
ALTER TABLE public.counterparty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view counterparty" ON public.counterparty FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add counterparty" ON public.counterparty FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can edit counterparty" ON public.counterparty FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete counterparty" ON public.counterparty FOR DELETE TO anon, authenticated USING (true);
CREATE TRIGGER update_counterparty_updated_at BEFORE UPDATE ON public.counterparty FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();