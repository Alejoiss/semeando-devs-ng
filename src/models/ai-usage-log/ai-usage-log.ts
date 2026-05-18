export interface AiUsageLog {
    id: string;
    user_id: string;
    action_type: 'evaluate_content' | 'submit_code';
    lesson_id?: string;
    created_at: string;
}
