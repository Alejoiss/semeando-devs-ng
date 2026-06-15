create table public.webhooks_log_mp (
    id uuid not null default gen_random_uuid(),
    payload jsonb not null,
    status text not null check (status in ('pending', 'success', 'error')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    constraint webhooks_log_mp_pkey primary key (id)
);

-- Habilita RLS para segurança
alter table public.webhooks_log_mp enable row level security;

-- Nenhuma política pública, apenas acesso restrito via service role nas edge functions
