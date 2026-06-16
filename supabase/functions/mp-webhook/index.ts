import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer"
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

    // Extract ts and v1 from x-signature (e.g. ts=1690000000,v1=abcdef...)
    let ts = ''
    let receivedHex = ''
    xSignature.split(',').forEach((part: string) => {
        const [key, val] = part.trim().split('=')
        if (key === 'ts') ts = val
        if (key === 'v1') receivedHex = val
    })

    if (!ts || !receivedHex) return false

    // Extract data.id from the body
    let dataId = ''
    try {
        const bodyObj = JSON.parse(rawBody)
        // O id pode estar em data.id ou direto em id, dependendo do tipo de evento
        dataId = bodyObj.data?.id || bodyObj.id || ''
    } catch {
        return false
    }

    // Official Mercado Pago template: id:{data.id};request-id:{x-request-id};ts:{ts};
    const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts};`

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

    let event: { topic?: string; type?: string; data?: { id?: string } }
    try {
        event = JSON.parse(rawBody)
    } catch {
        return new Response(
            JSON.stringify({ error: 'Invalid JSON payload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    let logId: string | null = null;
    try {
        const { data: logData, error: logError } = await serviceRoleClient
            .from('webhooks_log_mp')
            .insert({ payload: event, status: 'pending' })
            .select('id')
            .single();

        if (logError) throw logError;
        if (logData) logId = logData.id;
    } catch (logErr) {
        console.error('[mp-webhook] Failed to insert initial log:', logErr);
        return new Response(
            JSON.stringify({ error: 'Failed to initialize webhook log' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }

    const topic = event?.type || event?.topic

    try {
        if (topic === 'subscription_authorized_payment' || topic === 'payment') {
            await handleAuthorizedPayment(serviceRoleClient, event, mlAccessToken)
        } else if (topic === 'subscription_preapproval') {
            await handlePreapproval(serviceRoleClient, event, mlAccessToken)
        } else if (topic === 'topic_claims_integration_wh') {
            await handleClaim(serviceRoleClient, event, mlAccessToken)
        } else {
            console.log(`[mp-webhook] Unhandled topic received: ${topic}`)
        }

        if (logId) {
            await serviceRoleClient
                .from('webhooks_log_mp')
                .update({ status: 'success', updated_at: new Date().toISOString() })
                .eq('id', logId);
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[mp-webhook] Unhandled error processing topic "${topic}":`, message)
        
        if (logId) {
            await serviceRoleClient
                .from('webhooks_log_mp')
                .update({ status: 'error', updated_at: new Date().toISOString() })
                .eq('id', logId);

            try {
                const resendApiKey = Deno.env.get('RESEND_API_KEY');
                const smtpSender = Deno.env.get('SMTP_SENDER') || 'Semeando Devs <noreply@semeandodevs.com.br>';
                const adminEmail = 'joissonjdm@gmail.com';
                const subject = 'ERRO WEBHOOK MERCADO PAGO';
                const htmlContent = `
                    <div style="font-family: sans-serif; background-color: #060e20; color: #dee5ff; padding: 24px; border-radius: 8px;">
                        <h2 style="color: #ff716c;">Erro ao processar Webhook do Mercado Pago</h2>
                        <p>Ocorreu um erro ao processar o webhook do tópico <strong>${topic}</strong>.</p>
                        <p><strong>Log ID:</strong> ${logId}</p>
                        <p><strong>Erro:</strong> ${message}</p>
                    </div>
                `;

                if (resendApiKey) {
                    const response = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${resendApiKey}`
                        },
                        body: JSON.stringify({
                            from: smtpSender,
                            to: adminEmail,
                            subject: subject,
                            html: htmlContent
                        })
                    });
                    if (!response.ok) {
                        console.error('[Email] Resend API error:', await response.text());
                    }
                } else {
                    const smtpHost = Deno.env.get('SMTP_HOST') || 'host.docker.internal';
                    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '54325', 10);
                    const smtpUser = Deno.env.get('SMTP_USER') || '';
                    const smtpPass = Deno.env.get('SMTP_PASS') || '';

                    const transporter = nodemailer.createTransport({
                        host: smtpHost,
                        port: smtpPort,
                        secure: smtpPort === 465,
                        auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
                        tls: { rejectUnauthorized: false }
                    });
                    await transporter.sendMail({
                        from: smtpSender,
                        to: adminEmail,
                        subject: subject,
                        html: htmlContent
                    });
                }
            } catch (mailErr) {
                console.error('[Email] Failed to send webhook error alert:', mailErr);
            }
        }
    }

    return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
})
