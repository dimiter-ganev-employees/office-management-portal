ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS by_pc boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.problems.by_pc IS 'Логическа колона: 1 = Да, 0 = Не';