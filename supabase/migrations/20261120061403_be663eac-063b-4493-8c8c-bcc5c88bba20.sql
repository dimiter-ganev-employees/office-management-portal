ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS post_terminal boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.problems.post_terminal IS 'Логическа колона: 1 = Да, 0 = Не';