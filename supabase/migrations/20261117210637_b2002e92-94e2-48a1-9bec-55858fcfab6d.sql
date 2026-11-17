CREATE TABLE public.deliveries (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  delivery_date date NOT NULL DEFAULT current_date,
  supplier_id integer NOT NULL REFERENCES public.counterparty(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL,
  from_cash boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX deliveries_date_idx ON public.deliveries(delivery_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO anon, authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view deliveries" ON public.deliveries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add deliveries" ON public.deliveries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can edit deliveries" ON public.deliveries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete deliveries" ON public.deliveries FOR DELETE TO anon, authenticated USING (true);
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();