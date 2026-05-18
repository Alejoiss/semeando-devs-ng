CREATE TABLE ai_usage_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    action_type text not null check (action_type in ('evaluate_content', 'submit_code')),
    lesson_id uuid references lessons(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs" ON ai_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON ai_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
