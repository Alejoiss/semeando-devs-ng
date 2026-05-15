import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { handleAuthorizedPayment, handleClaim, handlePreapproval } from "./handlers.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function validateSignature(
    rawBody: string,
    xSignature: string | null,
    xRequestId: string | null,
    secret: string,
): Promise<boolean> {
    if (!xSignature || !xRequestId) return false

    const signedTemplate = `id:${xRequestId};request-body:${rawBody};`
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const msgData = encoder.encode(signedTemplate)

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
    const computedHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

    const receivedHex = xSignature.split(',').reduce((acc: string, part: string) => {
        const [key, val] = part.trim().split('=')
        return key === 'v1' ? val : acc
    }, '')

    return computedHex === receivedHex
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const mpWebhookSecret = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''
    const mlAccessToken = Deno.env.get('ML_ACCESS_TOKEN') ?? ''

    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')

    if (!xSignature || !xRequestId) {
        return new Response(
            JSON.stringify({ error: 'Missing required signature headers' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    const rawBody = await req.text()

    const isValid = await validateSignature(rawBody, xSignature, xRequestId, mpWebhookSecret)
    if (!isValid) {
        return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    let event: { topic?: string; data?: { id?: string } }
    try {
        event = JSON.parse(rawBody)
    } catch {
        return new Response(
            JSON.stringify({ error: 'Invalid JSON payload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    const topic = event?.topic

    try {
        if (topic === 'subscription_authorized_payment') {
            await handleAuthorizedPayment(serviceRoleClient, event, mlAccessToken)
        } else if (topic === 'subscription_preapproval') {
            await handlePreapproval(serviceRoleClient, event, mlAccessToken)
        } else if (topic === 'topic_claims_integration_wh') {
            await handleClaim(serviceRoleClient, event, mlAccessToken)
        } else {
            console.log(`[mp-webhook] Unhandled topic received: ${topic}`)
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[mp-webhook] Unhandled error processing topic "${topic}":`, message)
    }

    return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
})
