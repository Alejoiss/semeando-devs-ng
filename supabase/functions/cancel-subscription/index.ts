import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: { method: string; headers: { get: (arg0: string) => any }; json: () => any }) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Token de autenticação não encontrado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const mlAccessToken = Deno.env.get('ML_ACCESS_TOKEN') ?? ''

        if (!mlAccessToken) {
            throw new Error('ML_ACCESS_TOKEN not configured')
        }

        const userClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            global: { headers: { Authorization: authHeader } },
        })
        const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Usuário inválido ou token expirado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        const { subscriptionId } = body

        if (!subscriptionId) {
            return new Response(
                JSON.stringify({ error: 'ID da assinatura não fornecido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch subscription
        const { data: subscription, error: subError } = await serviceRoleClient
            .from('subscriptions')
            .select('*')
            .eq('id', subscriptionId)
            .eq('user_id', user.id)
            .single()

        if (subError || !subscription) {
            return new Response(
                JSON.stringify({ error: 'Assinatura não encontrada' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (subscription.status === 'canceled') {
            return new Response(
                JSON.stringify({ error: 'Assinatura já está cancelada' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Cancel in Mercado Pago if preapproval ID exists
        if (subscription.mp_preapproval_id) {
            const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscription.mp_preapproval_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mlAccessToken}`,
                },
                body: JSON.stringify({ status: 'cancelled' }),
            })

            if (!mpResponse.ok) {
                const mpData = await mpResponse.json()
                console.error('Mercado Pago cancellation error:', mpData)
                return new Response(
                    JSON.stringify({
                        error: 'Erro ao cancelar a assinatura no Mercado Pago',
                        details: mpData.message || mpData.error || 'Erro desconhecido',
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        // Update database status
        const { error: updateError } = await serviceRoleClient
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscriptionId)

        if (updateError) {
            throw updateError
        }

        // Update profile
        await serviceRoleClient
            .from('profiles')
            .update({ is_pro: false })
            .eq('id', user.id)

        return new Response(
            JSON.stringify({ message: 'Assinatura cancelada com sucesso' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error canceling subscription:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
