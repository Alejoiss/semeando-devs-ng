import { evaluateAchievements } from "./achievements.ts"
import { chatCompletion, loadModels } from "../_shared/openrouter.ts"

type CreateClient = (url: string, key: string, options?: any) => any

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const unauthorized = (error: string) =>
    new Response(JSON.stringify({ error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

export function createHandler(createClient: CreateClient) {
    return async (req: Request): Promise<Response> => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        try {
            const authHeader = req.headers.get('Authorization')
            if (!authHeader) return unauthorized('Token de autenticação não encontrado')

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
            if (userError || !user) return unauthorized('Usuário inválido ou token expirado')

            const body = await req.json()
            const { lessonId, description, code, initial_code } = body

            if (!lessonId || !description || !code) {
                return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Check rate limits
            const { data: profile, error: profileError } = await userClient
                .from('profiles')
                .select('is_pro')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                return new Response(JSON.stringify({ error: 'Erro ao buscar perfil do usuário' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const isPro = profile?.is_pro ?? false;
            const dailyLimit = isPro ? 30 : 5;

            // Dia de Brasília (UTC-3, sem horário de verão): o limite renova à meia-noite local
            const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
            const nowBrt = new Date(Date.now() - BRT_OFFSET_MS);
            const startOfDayStr = new Date(
                Date.UTC(nowBrt.getUTCFullYear(), nowBrt.getUTCMonth(), nowBrt.getUTCDate()) + BRT_OFFSET_MS
            ).toISOString();

            const { count, error: countError } = await userClient
                .from('ai_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('action_type', 'submit_code')
                .gte('created_at', startOfDayStr);

            if (countError) {
                console.error('Error checking rate limit:', countError);
                return new Response(JSON.stringify({ error: 'Erro ao verificar limites de uso da IA' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (count !== null && count >= dailyLimit) {
                return new Response(JSON.stringify({ error: `Limite diário excedido. Você pode submeter código ${dailyLimit} vezes por dia.` }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            let aiFeedback = '';
            let usedModel: string | null = null;
            if (openRouterApiKey) {
                const models = await loadModels(userClient, 'evaluate_challenge')
                const result = await chatCompletion({
                    apiKey: openRouterApiKey,
                    models,
                    messages: [
                        {
                            role: 'system',
                            content: "Você é um professor de programação avaliando o código de um aluno. Analise se a resposta resolve o problema proposto e gere um feedback textual indicando o que está bom e o que pode ser melhorado (organização, legibilidade, boas práticas). Não sugira outros assuntos que não estejam no desafio. Você está conversando diretamente com o aluno. Analise o código inicial (que é dado no próprio exercício) e o código que o aluno mandou, compare os dois e analise se o aluno conseguiu resolver o problema proposto. O aluno não pode ser reprovado. Seja claro e encorajador. Não retorne a solução do problema ao aluno, apenas o feedback e sugestões de melhoria para atender o que foi pedido. Retorne a resposta em markdown e em Português do Brasil. Não retorne uma resposta com continuidade, ela deve ser única e conclusiva, sem dar continuidade na conversa."
                        },
                        {
                            role: 'user',
                            content: `Problema proposto:\n${description}\n\nCódigo inicial:\n${initial_code}\n\nCódigo do aluno:\n${code}`
                        }
                    ]
                })

                if (result.ok) {
                    aiFeedback = result.content || 'Feedback gerado indisponível.';
                    usedModel = result.model;
                } else {
                    aiFeedback = 'Não foi possível gerar o feedback no momento.';
                }
            } else {
                aiFeedback = 'Configuração do agente de IA ausente.';
            }

            // Log successful usage
            if (openRouterApiKey && aiFeedback && aiFeedback !== 'Não foi possível gerar o feedback no momento.') {
                const { error: logError } = await userClient
                    .from('ai_usage_logs')
                    .insert({
                        user_id: user.id,
                        action_type: 'submit_code',
                        lesson_id: lessonId,
                        model: usedModel
                    });

                if (logError) {
                    console.error('Failed to log AI usage:', logError);
                }
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
    }
}

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
