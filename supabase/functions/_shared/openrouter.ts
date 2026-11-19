export type AiFeature = 'evaluate_challenge' | 'evaluate_lesson_content'

export const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'
export const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

/** Used only when the settings table cannot be read, so a settings outage never takes the AI features down. */
export const DEFAULT_MODELS: Record<AiFeature, string[]> = {
    evaluate_challenge: ['openai/gpt-5-nano'],
    evaluate_lesson_content: ['inclusionai/ring-2.6-1t'],
}

const REQUEST_TIMEOUT_MS = 60_000

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatResult =
    | { ok: true; content: string; model: string }
    | { ok: false; status: number; error: string }

export const cleanModels = (value: unknown): string[] =>
    Array.isArray(value)
        ? [...new Set(value.filter((m): m is string => typeof m === 'string').map((m) => m.trim()).filter(Boolean))]
        : []

export async function loadModels(client: any, feature: AiFeature): Promise<string[]> {
    try {
        const { data, error } = await client
            .from('ai_model_settings')
            .select('models')
            .eq('feature', feature)
            .maybeSingle()
        const models = cleanModels(data?.models)
        if (!error && models.length > 0) return models
        if (error) console.error('Could not read AI model settings:', error)
    } catch (err) {
        console.error('Could not read AI model settings:', err)
    }
    return DEFAULT_MODELS[feature]
}

/** Tries the models in order and moves on to the next one whenever a model fails (removed, rate limited, down). */
export async function chatCompletion(opts: {
    apiKey: string
    models: string[]
    messages: ChatMessage[]
    maxTokens?: number
}): Promise<ChatResult> {
    let last: ChatResult = { ok: false, status: 500, error: 'No model configured' }

    for (const model of opts.models) {
        try {
            const res = await fetch(OPENROUTER_CHAT_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: opts.messages,
                    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
                }),
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            })

            if (res.ok) {
                const data = await res.json()
                return { ok: true, content: data.choices?.[0]?.message?.content ?? '', model }
            }

            const error = await res.text()
            console.error(`OpenRouter error with model ${model} (${res.status}):`, error)
            last = { ok: false, status: res.status, error }
        } catch (err: any) {
            console.error(`OpenRouter request failed with model ${model}:`, err)
            last = { ok: false, status: 502, error: err?.message ?? String(err) }
        }
    }

    return last
}
