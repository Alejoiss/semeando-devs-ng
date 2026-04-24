import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { evaluateAchievements } from "./achievements.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header found')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // User client (scopes writes to user)
        const userClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            global: { headers: { Authorization: authHeader } },
        })

        // Service Role client (for cross-user reads and bypassing RLS if needed)
        const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)

        // Get the user from the JWT
        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) throw new Error('Invalid user or token')

        const body = await req.json()
        const { attemptId, lessonId, correctCount, totalCount, spentTime } = body

        if (!attemptId || !lessonId || correctCount === undefined || !totalCount || spentTime === undefined) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            })
        }

        // Fetch lesson info (xp, sub_module_id, type)
        const { data: lessonData, error: lessonDataError } = await serviceRoleClient
            .from('lessons')
            .select('sub_module_id, xp, type')
            .eq('id', lessonId)
            .single()

        if (lessonDataError) throw lessonDataError

        const passed = (correctCount / totalCount) >= 0.7
        const now = new Date().toISOString()

        // --- 2.1 Update user_quizzes ---
        const { error: quizUpdateError } = await userClient
            .from('user_quizzes')
            .update({
                score: correctCount,
                spent_time: spentTime,
                completed: passed,
                completed_at: now
            })
            .eq('id', attemptId)
            .eq('user_id', user.id)

        if (quizUpdateError) throw quizUpdateError

        // --- 2.2 Update user_lessons + XP Guard ---
        // Fetch current status to see if it was already completed (idempotency guard for XP)
        const { data: currentLessonProgress, error: fetchLPError } = await userClient
            .from('user_lessons')
            .select('completed')
            .eq('lesson_id', lessonId)
            .eq('user_id', user.id)
            .single()

        if (fetchLPError && fetchLPError.code !== 'PGRST116') throw fetchLPError
        const wasAlreadyCompleted = currentLessonProgress?.completed ?? false

        const { error: lessonUpdateError } = await userClient
            .from('user_lessons')
            .update({
                completed: passed,
                completed_at: passed ? now : null
            })
            .eq('lesson_id', lessonId)
            .eq('user_id', user.id)

        if (lessonUpdateError) throw lessonUpdateError

        let subModuleCompleted = false
        let moduleCompleted = false
        let xpAwardedTotal = 0

        if (passed) {
            // --- 2.3 Submodule Completion Cascade ---
            const subModuleId = lessonData.sub_module_id

            // Check if all lessons in this submodule are completed by this user
            const { data: subModuleLessons, error: smlError } = await serviceRoleClient
                .from('lessons')
                .select('id')
                .eq('sub_module_id', subModuleId)

            if (smlError) throw smlError

            const { data: userCompletedLessons, error: uclError } = await userClient
                .from('user_lessons')
                .select('lesson_id')
                .eq('user_id', user.id)
                .in('lesson_id', subModuleLessons.map(l => l.id))
                .eq('completed', true)

            if (uclError) throw uclError

            if (userCompletedLessons.length === subModuleLessons.length) {
                // Mark submodule as complete
                const { error: smUpdateError } = await userClient
                    .from('user_submodules')
                    .update({
                        completed: true,
                        completed_at: now
                    })
                    .eq('sub_module_id', subModuleId)
                    .eq('user_id', user.id)

                if (smUpdateError) throw smUpdateError
                subModuleCompleted = true

                // --- 2.4 Module Completion Cascade ---
                const { data: subModuleData, error: smDataError } = await serviceRoleClient
                    .from('submodules')
                    .select('module_id')
                    .eq('id', subModuleId)
                    .single()

                if (smDataError) throw smDataError
                const moduleId = subModuleData.module_id

                const { data: moduleSubModules, error: msmError } = await serviceRoleClient
                    .from('submodules')
                    .select('id')
                    .eq('module_id', moduleId)

                if (msmError) throw msmError

                const { data: userCompletedSubModules, error: ucsmError } = await userClient
                    .from('user_submodules')
                    .select('sub_module_id')
                    .eq('user_id', user.id)
                    .in('sub_module_id', moduleSubModules.map(sm => sm.id))
                    .eq('completed', true)

                if (ucsmError) throw ucsmError

                if (userCompletedSubModules.length === moduleSubModules.length) {
                    const { error: mUpdateError } = await userClient
                        .from('user_modules')
                        .update({
                            completed: true,
                            completed_at: now
                        })
                        .eq('module_id', moduleId)
                        .eq('user_id', user.id)

                    if (mUpdateError) throw mUpdateError
                    moduleCompleted = true
                }
            }

            // --- 2.5 XP Award ---
            if (!wasAlreadyCompleted && lessonData.xp > 0) {
                const xpToAward = lessonData.xp
                
                // 1. Insert into xp_log
                const { error: logError } = await serviceRoleClient
                    .from('xp_log')
                    .insert({
                        user_id: user.id,
                        amount: xpToAward,
                        reason: 'LESSON'
                    })
                
                if (logError) throw logError

                // 2. Update lifetime XP (xp table)
                // Since xp table doesn't have user_id as unique, we check first
                const { data: existingXp, error: xpFetchError } = await serviceRoleClient
                    .from('xp')
                    .select('id, total_xp')
                    .eq('user_id', user.id)
                    .single()

                if (xpFetchError && xpFetchError.code !== 'PGRST116') throw xpFetchError

                if (existingXp) {
                    const { error: xpUpdateError } = await serviceRoleClient
                        .from('xp')
                        .update({ total_xp: existingXp.total_xp + xpToAward })
                        .eq('id', existingXp.id)
                    if (xpUpdateError) throw xpUpdateError
                } else {
                    const { error: xpInsertError } = await serviceRoleClient
                        .from('xp')
                        .insert({ user_id: user.id, total_xp: xpToAward })
                    if (xpInsertError) throw xpInsertError
                }

                // 3. Update weekly XP
                const date = new Date()
                const week = getWeekNumber(date)
                const year = date.getFullYear()

                const { data: existingWeekXp, error: weekXpFetchError } = await serviceRoleClient
                    .from('xp_week')
                    .select('id, xp_amount')
                    .eq('user_id', user.id)
                    .eq('week', week)
                    .eq('year', year)
                    .single()

                if (weekXpFetchError && weekXpFetchError.code !== 'PGRST116') throw weekXpFetchError

                if (existingWeekXp) {
                    const { error: weekUpdateError } = await serviceRoleClient
                        .from('xp_week')
                        .update({ xp_amount: existingWeekXp.xp_amount + xpToAward })
                        .eq('id', existingWeekXp.id)
                    if (weekUpdateError) throw weekUpdateError
                } else {
                    const { error: weekInsertError } = await serviceRoleClient
                        .from('xp_week')
                        .insert({ user_id: user.id, week, year, xp_amount: xpToAward })
                    if (weekInsertError) throw weekInsertError
                }

                // 4. Update monthly XP
                const month = date.getMonth() + 1 // 1-12

                const { data: existingMonthXp, error: monthXpFetchError } = await serviceRoleClient
                    .from('xp_month')
                    .select('id, xp_amount')
                    .eq('user_id', user.id)
                    .eq('month', month)
                    .eq('year', year)
                    .single()

                if (monthXpFetchError && monthXpFetchError.code !== 'PGRST116') throw monthXpFetchError

                if (existingMonthXp) {
                    const { error: monthUpdateError } = await serviceRoleClient
                        .from('xp_month')
                        .update({ xp_amount: existingMonthXp.xp_amount + xpToAward })
                        .eq('id', existingMonthXp.id)
                    if (monthUpdateError) throw monthUpdateError
                } else {
                    const { error: monthInsertError } = await serviceRoleClient
                        .from('xp_month')
                        .insert({ user_id: user.id, month, year, xp_amount: xpToAward })
                    if (monthInsertError) throw monthInsertError
                }

                xpAwardedTotal = xpToAward
            }
        }

        // --- 2.6 Achievements Evaluation ---
        // Fetch moduleId for achievement rules
        const { data: subModuleData } = await serviceRoleClient
            .from('submodules')
            .select('module_id')
            .eq('id', lessonData.sub_module_id)
            .single()
        
        const moduleId = subModuleData?.module_id

        const { totalXpAwarded: achXp, earnedAchievements } = await evaluateAchievements(
            serviceRoleClient,
            user.id,
            {
                lessonId,
                subModuleId: lessonData.sub_module_id,
                moduleId,
                lessonType: lessonData.type,
                score: (correctCount / totalCount) * 10,
                passed,
                subModuleCompleted,
                moduleCompleted
            }
        )

        xpAwardedTotal += achXp

        // --- 2.7 Success Response ---
        return new Response(
            JSON.stringify({ 
                passed,
                subModuleCompleted,
                moduleCompleted,
                xpAwarded: xpAwardedTotal,
                earnedAchievements
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        console.error('Error processing quiz completion:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})

// Helper to get week number (ISO-8601)
function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
