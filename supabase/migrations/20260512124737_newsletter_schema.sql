ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS newsletter_active boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.newsletter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    body text NOT NULL,
    cta_url text,
    cta_label text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_newsletter (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    newsletter_id uuid REFERENCES public.newsletter(id) ON DELETE CASCADE,
    email_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, newsletter_id)
);

ALTER TABLE public.newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_newsletter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Newsletters are viewable by everyone" ON public.newsletter
    FOR SELECT USING (true);

CREATE POLICY "User newsletters are viewable by the user" ON public.user_newsletter
    FOR SELECT USING (auth.uid() = user_id);
