-- Create seed table
CREATE TABLE IF NOT EXISTS public.seed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_seeds BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create seed_log table
CREATE TABLE IF NOT EXISTS public.seed_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_log ENABLE ROW LEVEL SECURITY;

-- Policies for seed
CREATE POLICY "Users can read own seed balance." ON public.seed
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for seed_log
CREATE POLICY "Users can read own seed log." ON public.seed_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seed log." ON public.seed_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger function to update seed balance
CREATE OR REPLACE FUNCTION public.handle_seed_log_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.seed (user_id, total_seeds, updated_at)
    VALUES (NEW.user_id, NEW.amount, now())
    ON CONFLICT (user_id) DO UPDATE
    SET 
        total_seeds = public.seed.total_seeds + EXCLUDED.total_seeds,
        updated_at = EXCLUDED.updated_at;
    RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_seed_log_insert
    AFTER INSERT ON public.seed_log
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_seed_log_insert();
