import { evaluateAchievements } from "./achievements.ts"
import { applyXp, XpEntry } from "./xp.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type CreateClient = (url: string, key: string, options?: any) => any

export function createHandler(createClient: CreateClient) {
    return async (req: Request): Promise<Response> => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        try {
            const authHeader = req.headers.get('Authorization')
            if (!authHeader) throw new Error('No authorization header found')

            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

            // User client (to verify JWT and get user info)
            const userClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
                global: { headers: { Authorization: authHeader } },
            })

            // Service Role client (to perform writes bypassing RLS for stability)
            const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)

            const body = await req.json()
            const { attemptId, lessonId, correctCount, totalCount, spentTime } = body
            const hasAllParams = !!attemptId && !!lessonId && correctCount !== undefined && !!totalCount && spentTime !== undefined

            // Auth and lesson lookup are independent: run them together (lesson already carries its module id)
            const [userRes, lessonRes] = await Promise.all([
                userClient.auth.getUser(),
                hasAllParams
                    ? serviceRoleClient
                        .from('lessons')
                        .select('sub_module_id, xp, type, submodules(module_id)')
                        .eq('id', lessonId)
                        .single()
                    : Promise.resolve(null),
            ])

            const user = userRes.data?.user
            if (userRes.error || !user) throw new Error('Invalid user or token')

            if (!hasAllParams || !lessonRes) {
                return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            if (lessonRes.error) throw lessonRes.error
            const lessonData = lessonRes.data
            const subModuleId = lessonData.sub_module_id
            const moduleId = (lessonData.submodules as { module_id: string } | null)?.module_id

            const passed = (correctCount / totalCount) >= 0.7
            const now = new Date().toISOString()

            // --- 2.1 / 2.2 Update user_quizzes and user_lessons (+ XP guard) ---
            const [quizUpdate, lessonProgress] = await Promise.all([
                serviceRoleClient
                    .from('user_quizzes')
                    .update({
                        score: correctCount,
                        spent_time: spentTime,
                        completed: passed,
                        completed_at: now
                    })
                    .eq('id', attemptId)
                    .eq('user_id', user.id),
                // Fetch current status to see if it was already completed (idempotency guard for XP)
                serviceRoleClient
                    .from('user_lessons')
                    .select('completed')
                    .eq('lesson_id', lessonId)
                    .eq('user_id', user.id)
                    .maybeSingle(),
            ])

            if (quizUpdate.error) throw quizUpdate.error
            if (lessonProgress.error) throw lessonProgress.error
            const wasAlreadyCompleted = lessonProgress.data?.completed ?? false

            const { error: lessonUpdateError } = await serviceRoleClient
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
            const xpEntries: XpEntry[] = []

            if (passed) {
                // --- 2.3 Submodule Completion Cascade ---
                const [totalLessonsRes, completedLessonsRes] = await Promise.all([
                    serviceRoleClient
                        .from('lessons')
                        .select('id', { count: 'exact', head: true })
                        .eq('sub_module_id', subModuleId),
                    serviceRoleClient
                        .from('user_lessons')
                        .select('lesson_id, lessons!inner(sub_module_id)', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .eq('completed', true)
                        .eq('lessons.sub_module_id', subModuleId),
                ])

                if (totalLessonsRes.error) throw totalLessonsRes.error
                if (completedLessonsRes.error) throw completedLessonsRes.error

                if (completedLessonsRes.count === totalLessonsRes.count) {
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

                    // --- 2.4 Module Completion Cascade ---
                    const [totalSubModulesRes, completedSubModulesRes] = await Promise.all([
                        serviceRoleClient
                            .from('submodules')
                            .select('id', { count: 'exact', head: true })
                            .eq('module_id', moduleId),
                        serviceRoleClient
                            .from('user_submodules')
                            .select('sub_module_id, submodules!inner(module_id)', { count: 'exact', head: true })
                            .eq('user_id', user.id)
                            .eq('completed', true)
                            .eq('submodules.module_id', moduleId),
                    ])

                    if (totalSubModulesRes.error) throw totalSubModulesRes.error
                    if (completedSubModulesRes.error) throw completedSubModulesRes.error

                    if (completedSubModulesRes.count === totalSubModulesRes.count) {
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

                // --- 2.5 XP for the lesson (applied together with achievement XP below) ---
                if (lessonData.xp > 0) {
                    xpEntries.push({
                        amount: !wasAlreadyCompleted ? lessonData.xp : Math.ceil(lessonData.xp * 0.1),
                        reason: 'LESSON'
                    })
                }
            }

            // --- 2.6 Achievements Evaluation ---
            const { xpEntries: achievementXp, earnedAchievements } = await evaluateAchievements(
                serviceRoleClient,
                user.id,
                {
                    lessonId,
                    subModuleId,
                    moduleId: moduleId as string,
                    lessonType: lessonData.type,
                    score: (correctCount / totalCount) * 10,
                    passed,
                    subModuleCompleted,
                    moduleCompleted
                }
            )

            xpEntries.push(...achievementXp)
            await applyXp(serviceRoleClient, user.id, xpEntries)
            const xpAwardedTotal = xpEntries.reduce((sum, e) => sum + e.amount, 0)

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
        } catch (error: any) {
            console.error('Error processing quiz completion:', error)
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }
    }
}
