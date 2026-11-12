-- O serviço extra-material ordena por created_at, mas a tabela foi criada sem essa coluna.
ALTER TABLE public.extra_material
    ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();
