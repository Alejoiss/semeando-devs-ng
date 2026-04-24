-- Create achievements table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    identification TEXT NOT NULL UNIQUE,
    requirement TEXT NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    xp_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    viewed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read all achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read own user_achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Seed achievements
INSERT INTO public.achievements (name, icon, identification, requirement, xp_amount) VALUES
('Aprendiz de tags', 'aprendiz-de-tags.png', 'APRENDIZ_DE_TAGS', 'Concluir o módulo de HTML', 200),
('Combo insano', 'combo-insano.png', 'COMBO_INSANO', 'Fazer 10 lições perfeitas seguidas', 100),
('Estilista da Web', 'estilista-da-web.png', 'ESTILISTA_DA_WEB', 'Concluir o módulo de CSS', 200),
('Imparável', 'imparavel.png', 'IMPARAVEL', 'Fazer uma sequência de 10 dias seguidos.', 200),
('Mago das funções', 'mago-das-funcoes.png', 'MAGO_DAS_FUNCOES', 'Concluir o módulo de JavaScript', 200),
('Maratonista do Código', 'maratonista-do-codigo.png', 'MARATONISTA_DO_CODIGO', 'Fazer uma sequência de 5 dias seguidos.', 100),
('Meu Primeiro Desafio', 'meu-primeiro-desafio.png', 'MEU_PRIMEIRO_DESAFIO', 'Concluir uma lição de desafio', 100),
('Minha Primeira Revisão', 'minha-primeira-revisao.png', 'MINHA_PRIMEIRA_REVISAO', 'Concluir uma lição de revisão', 50),
('Modo Foguete', 'modo-foguete.png', 'MODO_FOGUETE', 'Concluir 10 lições no mesmo dia', 200),
('Perfeccionista do código', 'perfeccionista-do-codigo.png', 'PERFECCIONISTA_DO_CODIGO', 'Refazer uma lição para tentar melhorar', 50),
('Primeiro Passo no Código', 'primeiro-passo-no-codigo.png', 'PRIMEIRO_PASSO_NO_CODIGO', 'Concluir sua primeira lição', 50),
('Série Perfeita', 'serie-perfeita.png', 'SERIE_PERFEITA', 'Concluir 5 lições perfeitas em seguida', 100);
