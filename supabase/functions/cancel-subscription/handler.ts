type CreateClient = (url: string, key: string, options?: any) => any

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function addMonthsClamped(date: Date, months: number): Date {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
    target.setUTCDate(Math.min(date.getUTCDate(), lastDay))
    target.setUTCHours(date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds())
    return target
}

export function calculateNextBillingDate(createdAt: string, billingCycle: string): Date {
    const created = new Date(createdAt)
    const now = new Date()

    if (billingCycle === 'monthly') {
        let monthsDiff = (now.getUTCFullYear() - created.getUTCFullYear()) * 12 + now.getUTCMonth() - created.getUTCMonth()
        if (now.getUTCDate() >= created.getUTCDate()) {
            monthsDiff++
        } else {
            monthsDiff = Math.max(1, monthsDiff)
        }
        return addMonthsClamped(created, monthsDiff)
    }

    let yearsDiff = now.getUTCFullYear() - created.getUTCFullYear()
    const pastAnniversary =
        now.getUTCMonth() > created.getUTCMonth() ||
        (now.getUTCMonth() === created.getUTCMonth() && now.getUTCDate() >= created.getUTCDate())

    yearsDiff = pastAnniversary ? yearsDiff + 1 : Math.max(1, yearsDiff)
    return addMonthsClamped(created, yearsDiff * 12)
}

export function createHandler(createClient: CreateClient) {
    return async (req: Request): Promise<Response> => {
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

            if (subscription.status === 'cancelled') {
                return new Response(
                    JSON.stringify({ error: 'Assinatura já está cancelada' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // Cancel in Mercado Pago to prevent future charges
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

            // Calculate the last day of the already-paid billing period
            const accessUntil = calculateNextBillingDate(subscription.created_at, subscription.billing_cycle)

            // Mark subscription as cancelled but keep access until the paid period ends
            const { error: updateError } = await serviceRoleClient
                .from('subscriptions')
                .update({
                    status: 'cancelled',
                    access_until: accessUntil.toISOString(),
                })
                .eq('id', subscriptionId)

            if (updateError) {
                throw updateError
            }

            // Keep is_pro = true but set pro_until so the cron job can expire it automatically
            const { error: profileError } = await serviceRoleClient
                .from('profiles')
                .update({ pro_until: accessUntil.toISOString() })
                .eq('id', user.id)

            if (profileError) {
                throw profileError
            }

            return new Response(
                JSON.stringify({
                    message: 'Assinatura cancelada com sucesso',
                    access_until: accessUntil.toISOString(),
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )

        } catch (error: any) {
            console.error('Error canceling subscription:', error)
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
    }
}
