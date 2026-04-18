-- Alter section_content to support questions
ALTER TABLE public.section_content ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE public.section_content ADD COLUMN question_id UUID;

-- Create quizzes table
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID UNIQUE NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    spent_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add question_id FK to section_content
ALTER TABLE public.section_content ADD CONSTRAINT section_content_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;

-- Create answers table
CREATE TABLE public.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_quizzes table
CREATE TABLE public.user_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    spent_time INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_questions table
CREATE TABLE public.user_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES public.answers(id) ON DELETE SET NULL,
    is_correct BOOLEAN DEFAULT false,
    answered_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.answers FOR SELECT USING (true);

CREATE POLICY "Users can read own user_quizzes" ON public.user_quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_quizzes" ON public.user_quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_quizzes" ON public.user_quizzes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own user_questions" ON public.user_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_questions" ON public.user_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_questions" ON public.user_questions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
