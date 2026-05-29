import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

        // User client (to verify JWT)
        const userClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
            global: { headers: { Authorization: authHeader } },
        })

        // Service Role client (to perform writes bypassing RLS for stability)
        const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)

        // Get the user from the JWT
        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Usuário inválido ou token expirado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        const { planId, billingCycle, couponCode, paymentMethod, cardTokenId } = body

        if (!planId || !billingCycle || !paymentMethod) {
            return new Response(
                JSON.stringify({ error: 'Campos obrigatórios: planId, billingCycle, paymentMethod' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 1. Fetch Plan
        const { data: planData, error: planError } = await serviceRoleClient
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single()

        if (planError || !planData) {
            return new Response(
                JSON.stringify({ error: 'Plano não encontrado' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        let transactionAmount = billingCycle === 'monthly'
            ? Number(planData.monthly_price)
            : Number(planData.yearly_price)

        let couponId: string | null = null

        // 2. Handle Coupon
        if (couponCode) {
            const normalizedCode = couponCode.trim().toUpperCase()
            const { data: couponData, error: couponError } = await serviceRoleClient
                .from('coupons')
                .select('*')
                .eq('code', normalizedCode)
                .single()

            if (couponError || !couponData) {
                return new Response(
                    JSON.stringify({ error: 'Cupom não encontrado' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const now = new Date()
            if (couponData.expiration_date && new Date(couponData.expiration_date) < now) {
                return new Response(
                    JSON.stringify({ error: 'Cupom expirado' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (couponData.usage_limit !== null && couponData.used_count >= couponData.usage_limit) {
                return new Response(
                    JSON.stringify({ error: 'Cupom atingiu o limite de uso' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (couponData.valid_for_plan_type !== 'all' && couponData.valid_for_plan_type !== billingCycle) {
                return new Response(
                    JSON.stringify({ error: `Este cupom é válido apenas para o plano ${couponData.valid_for_plan_type === 'monthly' ? 'Mensal' : 'Anual'}.` }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            if (couponData.discount_type === 'percentage') {
                transactionAmount = transactionAmount * (1 - Number(couponData.discount_value) / 100)
            } else {
                // Fixed coupon: discount applies per month.
                // For yearly billing, scale proportionally: (monthly - discount) * 12 * annual_factor
                if (billingCycle === 'yearly') {
                    const monthlyPrice = Number(planData.monthly_price)
                    const annualFactor = monthlyPrice > 0 ? Number(planData.yearly_price) / (monthlyPrice * 12) : 1
                    const discountedMonthly = Math.max(0, monthlyPrice - Number(couponData.discount_value))
                    transactionAmount = discountedMonthly * 12 * annualFactor
                } else {
                    transactionAmount = transactionAmount - Number(couponData.discount_value)
                }
            }

            transactionAmount = Math.max(0, Math.round(transactionAmount * 100) / 100)

            await serviceRoleClient
                .from('coupons')
                .update({ used_count: (couponData.used_count || 0) + 1 })
                .eq('id', couponData.id)

            couponId = couponData.id
        }

        const frequency = billingCycle === 'monthly' ? 1 : 12
        let mpPreapprovalId = ''
        let responseData: any = {}

        // 3. Process Payment with Mercado Pago
        if (paymentMethod === 'card') {
            const preapprovalPayload = {
                reason: `Assinatura PRO - ${planData.name}`,
                external_reference: `user_${user.id}_plan_${planId}`,
                payer_email: user.email,
                card_token_id: cardTokenId,
                back_url: 'https://semeandodevs.com/app/home',
                auto_recurring: {
                    frequency,
                    frequency_type: 'months',
                    transaction_amount: transactionAmount,
                    currency_id: 'BRL',
                },
                status: 'authorized',
            }

            const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mlAccessToken}`,
                },
                body: JSON.stringify(preapprovalPayload),
            })

            const mpData = await mpResponse.json()
            if (!mpResponse.ok) {
                return new Response(
                    JSON.stringify({
                        error: 'Erro ao processar pagamento.',
                        details: mpData.message || mpData.error || 'Erro desconhecido',
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            mpPreapprovalId = mpData.id
            responseData = { status: 'pending', preapproval_id: mpData.id }

        } else if (paymentMethod === 'pix') {
            const paymentPayload = {
                transaction_amount: transactionAmount,
                description: `Assinatura PRO - ${planData.name}`,
                payment_method_id: 'pix',
                payer: { email: user.email },
                external_reference: `user_${user.id}_plan_${planId}`
            }

            const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mlAccessToken}`,
                    'X-Idempotency-Key': crypto.randomUUID()
                },
                body: JSON.stringify(paymentPayload),
            })

            const mpData = await mpResponse.json()
            if (!mpResponse.ok) {
                return new Response(
                    JSON.stringify({
                        error: 'Erro ao gerar PIX no Mercado Pago',
                        details: mpData.message || mpData.error || 'Erro desconhecido',
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            
            mpPreapprovalId = mpData.id.toString()
            subscriptionStatus = 'pending'
            responseData = {
                status: 'pending',
                payment_id: mpData.id,
                qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
                qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
            }
        }

        // 4. Save Subscription (using serviceRoleClient)
        // Status is always 'pending' here — the mp-webhook is the sole authority
        // for transitioning to 'active' and setting is_pro=true on the profile.
        const { data: insertedSub, error: insertError } = await serviceRoleClient
            .from('subscriptions')
            .insert({
                user_id: user.id,
                plan_id: planId,
                coupon_id: couponId,
                mp_preapproval_id: mpPreapprovalId,
                billing_cycle: billingCycle,
                transaction_amount: transactionAmount,
                status: 'pending',
            })
            .select('id')
            .single()

        if (insertError) throw insertError

        return new Response(
            JSON.stringify({ ...responseData, subscription_id: insertedSub.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('Error processing subscription:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
