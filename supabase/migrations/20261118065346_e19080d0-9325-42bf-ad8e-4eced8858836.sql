ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS credit boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.problems.credit IS 'Логическа колона: 1 = Да, 0 = Не';