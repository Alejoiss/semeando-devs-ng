import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { evaluateAchievements } from "./achievements.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: { method: string; headers: { get: (arg0: string) => any }; json: () => any }) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header found')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''

        // User client (to verify JWT and get user info)
        const userClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            global: { headers: { Authorization: authHeader } },
        })

        // Service Role client (to perform writes bypassing RLS for stability)
        const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) throw new Error('Invalid user or token')

        const body = await req.json()
        const { lessonId, description, code } = body

        if (!lessonId || !description || !code) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        let aiFeedback = '';
        if (openRouterApiKey) {
            // Call OpenRouter
            const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openRouterApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "inclusionai/ring-2.6-1t:free",
                    "messages": [
                        {
                            "role": "system",
                            "content": "Você é um professor de programação avaliando o código de um aluno. Analise se a resposta resolve o problema proposto e gere um feedback textual indicando o que está bom e o que pode ser melhorado (organização, legibilidade, boas práticas). O aluno não pode ser reprovado. Seja claro e encorajador."
                        },
                        {
                            "role": "user",
                            "content": `Problema proposto:\n${description}\n\nCódigo do aluno:\n${code}`
                        }
                    ]
                })
            });

            if (openRouterRes.ok) {
                const openRouterData = await openRouterRes.json();
                aiFeedback = openRouterData.choices?.[0]?.message?.content || 'Feedback gerado indisponível.';
            } else {
                console.error('OpenRouter error:', await openRouterRes.text());
                aiFeedback = 'Não foi possível gerar o feedback no momento.';
            }
        } else {
            aiFeedback = 'Configuração do agente de IA ausente.';
        }

        // --- Completion Logic ---
        const now = new Date().toISOString()

        // Fetch lesson info
        const { data: lessonData, error: lessonDataError } = await serviceRoleClient
            .from('lessons')
            .select('sub_module_id, xp, type')
            .eq('id', lessonId)
            .single()

        if (lessonDataError) throw lessonDataError

        // Fetch current status
        const { data: currentLessonProgress, error: fetchLPError } = await serviceRoleClient
            .from('user_lessons')
            .select('completed')
            .eq('lesson_id', lessonId)
            .eq('user_id', user.id)
            .single()

        if (fetchLPError && fetchLPError.code !== 'PGRST116') throw fetchLPError
        const wasAlreadyCompleted = currentLessonProgress?.completed ?? false

        // Update user_lesson (using serviceRoleClient)
        const { error: lessonUpdateError } = await serviceRoleClient
            .from('user_lessons')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                completed_at: now,
                saved_code: code,
                submitted_code: code,
                ai_feedback: aiFeedback
            }, { onConflict: 'user_id,lesson_id' })

        if (lessonUpdateError) throw lessonUpdateError

        let subModuleCompleted = false
        let moduleCompleted = false
        let xpAwardedTotal = 0

        // Cascade logic
        const subModuleId = lessonData.sub_module_id

        const { data: subModuleLessons, error: smlError } = await serviceRoleClient
            .from('lessons')
            .select('id')
            .eq('sub_module_id', subModuleId)

        if (smlError) throw smlError

        const { data: userCompletedLessons, error: uclError } = await serviceRoleClient
            .from('user_lessons')
            .select('lesson_id')
            .eq('user_id', user.id)
            .in('lesson_id', subModuleLessons.map((l: { id: any }) => l.id))
            .eq('completed', true)

        if (uclError) throw uclError

        if (userCompletedLessons.length === subModuleLessons.length) {
            const { error: smUpdateError } = await serviceRoleClient
                .from('user_submodules')
                .upsert({
                    user_id: user.id,
                    sub_module_id: subModuleId,
                    completed: true,
                    completed_at: now
                }, { onConflict: 'user_id,sub_module_id' })

            if (smUpdateError) throw smUpdateError
            subModuleCompleted = true

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

            const { data: userCompletedSubModules, error: ucsmError } = await serviceRoleClient
                .from('user_submodules')
                .select('sub_module_id')
                .eq('user_id', user.id)
                .in('sub_module_id', moduleSubModules.map((sm: { id: any }) => sm.id))
                .eq('completed', true)

            if (ucsmError) throw ucsmError

            if (userCompletedSubModules.length === moduleSubModules.length) {
                const { error: mUpdateError } = await serviceRoleClient
                    .from('user_modules')
                    .upsert({
                        user_id: user.id,
                        module_id: moduleId,
                        completed: true,
                        completed_at: now
                    }, { onConflict: 'user_id,module_id' })

                if (mUpdateError) throw mUpdateError
                moduleCompleted = true
            }
        }

        // XP Award
        if (!wasAlreadyCompleted && lessonData.xp > 0) {
            const xpToAward = lessonData.xp

            const { error: logError } = await serviceRoleClient
                .from('xp_log')
                .insert({ user_id: user.id, amount: xpToAward, reason: 'CHALLENGE' })
            if (logError) throw logError

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

            const month = date.getMonth() + 1

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

        // Achievements
        const { data: subModData } = await serviceRoleClient
            .from('submodules')
            .select('module_id')
            .eq('id', lessonData.sub_module_id)
            .single()

        const { totalXpAwarded: achXp, earnedAchievements } = await evaluateAchievements(
            serviceRoleClient,
            user.id,
            {
                lessonId,
                subModuleId: lessonData.sub_module_id,
                moduleId: subModData?.module_id,
                lessonType: lessonData.type,
                score: 10,
                passed: true,
                subModuleCompleted,
                moduleCompleted
            }
        )

        xpAwardedTotal += achXp

        return new Response(
            JSON.stringify({
                aiFeedback,
                xpAwarded: xpAwardedTotal,
                earnedAchievements,
                subModuleCompleted,
                moduleCompleted
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error: any) {
        console.error('Error processing challenge evaluation:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
