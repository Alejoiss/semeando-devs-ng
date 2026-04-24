
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '59c8b48e-234f-4e59-87a1-4cdd79adbe1a';

// Mock context
const context = {
    lessonId: 'some-lesson-id',
    subModuleId: 'some-submodule-id',
    moduleId: 'some-module-id',
    lessonType: 'LESSON',
    score: 8,
    passed: true,
    subModuleCompleted: false,
    moduleCompleted: false,
};

// Import the logic (I'll copy-paste it here for simplicity in scratch)
async function evaluateAchievements(
    supabase: any,
    userId: string,
    context: any
) {
    let totalXpAwarded = 0;
    const earnedAchievements: any[] = [];

    try {
        const { data: allAchievements } = await supabase.from('achievements').select('*');
        const { data: userAchievements } = await supabase.from('user_achievements').select('*').eq('user_id', userId);

        const existingAchIds = new Set((userAchievements || []).map((ua: any) => ua.achievement_id));
        const missingAchievements = allAchievements.filter((a: any) => !existingAchIds.has(a.id));

        if (missingAchievements.length > 0) {
            const initialRecords = missingAchievements.map((a: any) => ({
                user_id: userId,
                achievement_id: a.id,
                progress: 0,
                completed: false,
                viewed: false
            }));

            await supabase.from('user_achievements').insert(initialRecords);
            userAchievements?.push(...initialRecords);
        }

        return { success: true, missingCount: missingAchievements.length };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

const result = await evaluateAchievements(supabase, userId, context);
console.log(JSON.stringify(result));
