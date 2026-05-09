-- Create owners table
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    whatsapp TEXT,
    further_information TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER trg_owners_set_updated_at
BEFORE INSERT OR UPDATE ON public.owners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Insert default owner
INSERT INTO public.owners (name, email, address, phone, whatsapp, further_information)
VALUES (
    'Joisson José de Mello',
    'joissonjdm@gmail.com',
    'Rua Matilde Borsoi, 932 - São Francisco - Pato Branco - CEP 85504-811',
    '46 991273075',
    '46 991273075',
    'chave pix cpf 08082397918'
);

-- Add owner_id to lessons
-- Step 1: Add the column as nullable
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Step 2: Link existing lessons to the default owner
UPDATE public.lessons
SET owner_id = (SELECT id FROM public.owners WHERE email = 'joissonjdm@gmail.com' LIMIT 1)
WHERE owner_id IS NULL;

-- Step 3: Make owner_id NOT NULL and add foreign key
ALTER TABLE public.lessons ALTER COLUMN owner_id SET NOT NULL;

-- Check if constraint already exists before adding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_owner_id_fkey') THEN
        ALTER TABLE public.lessons ADD CONSTRAINT lessons_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id);
    END IF;
END $$;

-- RLS Policy
CREATE POLICY "Authenticated users can read owners"
ON public.owners
FOR SELECT
TO authenticated
USING (true);
