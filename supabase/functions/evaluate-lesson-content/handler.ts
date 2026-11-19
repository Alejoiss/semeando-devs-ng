import { chatCompletion, loadModels } from "../_shared/openrouter.ts"

type CreateClient = (url: string, key: string, options?: any) => any

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function createHandler(createClient: CreateClient) {
    return async (req: Request): Promise<Response> => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        try {
            const authHeader = req.headers.get('Authorization')
            if (!authHeader) {
                return new Response(JSON.stringify({ error: 'No authorization header found' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''

            if (!openRouterApiKey) {
                return new Response(JSON.stringify({ error: 'OpenRouter API Key configuration is missing' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Create client with Authorization header to verify JWT
            const userClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
                global: { headers: { Authorization: authHeader } },
            })

            const { data: { user }, error: userError } = await userClient.auth.getUser()
            if (userError || !user) {
                return new Response(JSON.stringify({ error: 'Invalid user or token' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const { data: caller, error: callerError } = await userClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle()
            if (callerError) throw callerError
            if (caller?.role !== 'teacher' && caller?.role !== 'admin') {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const body = await req.json()
            const { lesson_id, title, description, markdowns } = body

            if (!lesson_id || !title || !description || !markdowns || !Array.isArray(markdowns) || markdowns.length === 0) {
                return new Response(JSON.stringify({ error: 'Missing or invalid parameters' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)
            const { data: lesson, error: lessonError } = await serviceRoleClient
                .from('lessons')
                .select('id')
                .eq('id', lesson_id)
                .maybeSingle()
            if (lessonError) throw lessonError
            if (!lesson) {
                return new Response(JSON.stringify({ error: 'Lição não encontrada' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Check rate limit
            const { count, error: countError } = await userClient
                .from('ai_usage_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('action_type', 'evaluate_content')
                .eq('lesson_id', lesson_id);

            if (countError) {
                console.error('Error checking rate limit:', countError);
                return new Response(JSON.stringify({ error: 'Erro ao verificar limites de uso da IA' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (count !== null && count >= 3) {
                return new Response(JSON.stringify({ error: 'Limite excedido. Você pode avaliar uma lição com IA no máximo 3 vezes.' }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Format user message content containing metadata and markdown contents
            const formattedMarkdownBlocks = markdowns.map((content, index) => {
                return `--- BLOCO DE CONTEÚDO ${index + 1} ---\n${content}`
            }).join('\n\n')

            const userMessageContent = `Título da Lição: ${title}\nDescrição da Lição: ${description}\n\nConteúdos para avaliação:\n${formattedMarkdownBlocks}`

            console.log(formattedMarkdownBlocks);

            const models = await loadModels(userClient, 'evaluate_lesson_content')
            const result = await chatCompletion({
                apiKey: openRouterApiKey,
                models,
                messages: [
                    {
                        role: 'system',
                        content: "Você é um professor de programação.\nAvalie se o conteúdo está de acordo com o padrão de qualidade que queremos para o projeto.\nNÃO reprove o professor, apenas indique pontos de melhoria.\nO conteúdo deve seguir os seguintes padrões:\n- O conteúdo deve ser claro e objetivo.\n- O conteúdo deve ser fácil de entender.\n- O conteúdo deve ser relevante para o aluno.\n- Valide ortograficamente e gramaticalmente o conteúdo.\n- Valide o markdown, garantindo os melhores usos, como organização dos blocos, títulos, etc.\n- Se necessário, sugira analogias ou exemplos que podem ser usados para ilustrar o conteúdo.\n- Não sugira conteúdos extras do conteúdo, como exercícios, desafios, etc. Avalie somente o que está sendo enviado.\n- Responda em português do Brasil."
                    },
                    {
                        role: 'user',
                        content: userMessageContent
                    }
                ]
            })

            if (!result.ok) {
                return new Response(JSON.stringify({ error: `OpenRouter call failed: ${result.error}` }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            const aiFeedback = result.content || 'Não foi possível extrair o feedback.'

            // Log successful usage
            const { error: logError } = await userClient
                .from('ai_usage_logs')
                .insert({
                    user_id: user.id,
                    action_type: 'evaluate_content',
                    lesson_id: lesson_id,
                    model: result.model
                });

            if (logError) {
                console.error('Failed to log AI usage:', logError);
            }

            return new Response(
                JSON.stringify({ aiFeedback }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        } catch (error: any) {
            console.error('Error in evaluate-lesson-content:', error)
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    }
}
