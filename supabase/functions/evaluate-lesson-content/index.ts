import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
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

        const body = await req.json()
        const { title, description, markdowns } = body

        if (!title || !description || !markdowns || !Array.isArray(markdowns) || markdowns.length === 0) {
            return new Response(JSON.stringify({ error: 'Missing or invalid parameters' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Format user message content containing metadata and markdown contents
        const formattedMarkdownBlocks = markdowns.map((content, index) => {
            return `--- BLOCO DE CONTEÚDO ${index + 1} ---\n${content}`
        }).join('\n\n')

        const userMessageContent = `Título da Lição: ${title}\nDescrição da Lição: ${description}\n\nConteúdos para avaliação:\n${formattedMarkdownBlocks}`

        console.log(formattedMarkdownBlocks);

        // Call OpenRouter
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "inclusionai/ring-2.6-1t",
                "messages": [
                    {
                        "role": "system",
                        "content": "Você é um professor de programação.\nAvalie se o conteúdo está de acordo com o padrão de qualidade que queremos para o projeto.\nNÃO reprove o professor, apenas indique pontos de melhoria.\nO conteúdo deve seguir os seguintes padrões:\n- O conteúdo deve ser claro e objetivo.\n- O conteúdo deve ser fácil de entender.\n- O conteúdo deve ser relevante para o aluno.\n- Valide ortograficamente e gramaticalmente o conteúdo.\n- Valide o markdown, garantindo os melhores usos, como organização dos blocos, títulos, etc.\n- Se necessário, sugira analogias ou exemplos que podem ser usados para ilustrar o conteúdo.\n- Não sugira conteúdos extras do conteúdo, como exercícios, desafios, etc. Avalie somente o que está sendo enviado.\n- Responda em português do Brasil."
                    },
                    {
                        "role": "user",
                        "content": userMessageContent
                    }
                ]
            })
        })

        if (!openRouterRes.ok) {
            const errorText = await openRouterRes.text()
            console.error('OpenRouter error response:', errorText)
            return new Response(JSON.stringify({ error: `OpenRouter call failed: ${errorText}` }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const openRouterData = await openRouterRes.json()
        const aiFeedback = openRouterData.choices?.[0]?.message?.content || 'Não foi possível extrair o feedback.'

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
})
