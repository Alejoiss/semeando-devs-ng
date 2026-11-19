import { chatCompletion, cleanModels, OPENROUTER_MODELS_URL, type AiFeature } from "../_shared/openrouter.ts"
import { sendEmail, type Mailer } from "../_shared/mailer.ts"

type CreateClient = (url: string, key: string, options?: any) => any

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export type ModelStatus = 'ok' | 'expiring' | 'removed' | 'failing'

export interface ModelCheck {
    feature: AiFeature
    model: string
    status: ModelStatus
    expiresAt: string | null
    detail: string | null
}

const FEATURE_LABELS: Record<AiFeature, string> = {
    evaluate_challenge: 'Avaliação de desafios de código',
    evaluate_lesson_content: 'Avaliação de conteúdo de lições',
}

const STATUS_LABELS: Record<Exclude<ModelStatus, 'ok'>, string> = {
    removed: 'Removido do OpenRouter',
    failing: 'Falhando na chamada de teste',
    expiring: 'Retirada agendada',
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Returns id -> expiration date, or null when the public catalog cannot be read. */
async function loadCatalog(): Promise<Map<string, string | null> | null> {
    try {
        const res = await fetch(OPENROUTER_MODELS_URL, { signal: AbortSignal.timeout(30_000) })
        if (!res.ok) return null
        const body = await res.json()
        if (!Array.isArray(body?.data)) return null
        return new Map(body.data.map((m: any) => [m.id, m.expiration_date ?? null]))
    } catch (err) {
        console.error('Could not read the OpenRouter catalog:', err)
        return null
    }
}

export const buildAlertEmail = (problems: ModelCheck[]) => {
    const rows = problems.map((p) => {
        const when = p.expiresAt ? ` (data de retirada: ${p.expiresAt})` : ''
        return { label: FEATURE_LABELS[p.feature], model: p.model, status: `${STATUS_LABELS[p.status as Exclude<ModelStatus, 'ok'>]}${when}`, detail: p.detail }
    })

    const html = `
        <div style="font-family: sans-serif; background-color: #060e20; color: #dee5ff; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3fc2fb; margin-top: 0;">Atenção: modelos de IA com problema</h2>
            <p style="line-height: 1.6;">A verificação diária encontrou problemas nos modelos do OpenRouter usados pela plataforma:</p>
            <ul style="line-height: 1.6;">
                ${rows.map((r) => `<li><strong>${escapeHtml(r.label)}</strong>: <code>${escapeHtml(r.model)}</code> - ${escapeHtml(r.status)}${r.detail ? `<br><small>${escapeHtml(r.detail)}</small>` : ''}</li>`).join('')}
            </ul>
            <p style="line-height: 1.6;">Ajuste a lista em <strong>Admin &gt; Configurações IA</strong> antes que as avaliações deixem de funcionar.</p>
        </div>`

    const text = [
        'Atenção: modelos de IA com problema',
        '',
        ...rows.map((r) => `- ${r.label}: ${r.model} - ${r.status}${r.detail ? ` (${r.detail})` : ''}`),
        '',
        'Ajuste a lista em Admin > Configurações IA antes que as avaliações deixem de funcionar.',
    ].join('\n')

    return { subject: `[Semeando Devs] ${problems.length === 1 ? '1 modelo de IA com problema' : `${problems.length} modelos de IA com problema`}`, html, text }
}

export function createHandler(createClient: CreateClient, nodemailer: Mailer) {
    return async (req: Request): Promise<Response> => {
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders })
        }

        try {
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)

            const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
            if (!token) return json({ error: 'Unauthorized' }, 401)

            // The cron job calls with the service role key; the admin panel calls with an admin session.
            if (!serviceRoleKey || token !== serviceRoleKey) {
                const { data: userData, error: userError } = await supabase.auth.getUser(token)
                if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401)

                const { data: caller } = await supabase.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
                if (caller?.role !== 'admin') return json({ error: 'Forbidden' }, 403)
            }

            const apiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''
            if (!apiKey) return json({ error: 'OpenRouter API Key configuration is missing' }, 500)

            const payload = await req.json().catch(() => ({}))
            const notify = payload?.notify !== false

            const { data: settings, error: settingsError } = await supabase.from('ai_model_settings').select('feature, models')
            if (settingsError) throw settingsError

            const catalog = await loadCatalog()

            const smokeTests = new Map<string, Promise<{ ok: true } | { ok: false; error: string }>>()
            const smokeTest = (model: string) => {
                if (!smokeTests.has(model)) {
                    smokeTests.set(model, chatCompletion({
                        apiKey,
                        models: [model],
                        messages: [{ role: 'user', content: 'Responda apenas: ok' }],
                        maxTokens: 16,
                    }).then((r) => r.ok ? { ok: true as const } : { ok: false as const, error: `HTTP ${r.status}: ${r.error}`.slice(0, 300) }))
                }
                return smokeTests.get(model)!
            }

            const checks: ModelCheck[] = await Promise.all(
                (settings ?? []).flatMap((row: { feature: AiFeature; models: string[] }) =>
                    cleanModels(row.models).map(async (model): Promise<ModelCheck> => {
                        const expiresAt = catalog?.get(model) ?? null
                        const base = { feature: row.feature, model, expiresAt }

                        if (catalog && !catalog.has(model)) {
                            return { ...base, status: 'removed', detail: 'O modelo não está mais no catálogo do OpenRouter.' }
                        }
                        const result = await smokeTest(model)
                        if (!result.ok) return { ...base, status: 'failing', detail: result.error }
                        if (expiresAt) return { ...base, status: 'expiring', detail: null }
                        return { ...base, status: 'ok', detail: null }
                    }),
                ),
            )

            const problems = checks.filter((c) => c.status !== 'ok')
            let emailed: string[] = []
            let emailError: string | null = null

            if (notify && problems.length > 0) {
                const { data: alertRow } = await supabase.from('ai_alert_settings').select('emails').maybeSingle()
                emailed = cleanModels(alertRow?.emails)

                if (emailed.length === 0) {
                    const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin')
                    emailed = cleanModels((admins ?? []).map((a: { email: string | null }) => a.email))
                }

                if (emailed.length > 0) {
                    try {
                        await sendEmail({ to: emailed, ...buildAlertEmail(problems) }, nodemailer)
                    } catch (err: any) {
                        console.error('Failed to send the AI model alert:', err)
                        emailError = err?.message ?? 'Falha ao enviar o e-mail'
                        emailed = []
                    }
                }
            }

            return json({ checks, catalogAvailable: catalog !== null, emailed, emailError })
        } catch (error: any) {
            console.error('Error in check-ai-models:', error)
            return json({ error: error.message }, 500)
        }
    }
}
