import { assertEquals } from "jsr:@std/assert@1"
import { createFakeSupabase } from "../_testing/fake-supabase.ts"
import { createHandler } from "./handler.ts"

const USER = { id: 'user-1', email: 'aluno@example.com' }
const PLAN = { id: 'plan-1', name: 'PRÓ', monthly_price: 10, yearly_price: 100 }
const MP_PREAPPROVAL = 'https://api.mercadopago.com/preapproval'
const MP_PAYMENTS = 'https://api.mercadopago.com/v1/payments'

type Coupon = Record<string, unknown>
const coupon = (over: Coupon = {}): Coupon => ({
    id: 'c-1',
    discount_type: 'percentage',
    discount_value: 20,
    expiration_date: null,
    usage_limit: null,
    used_count: 0,
    valid_for_plan_type: 'all',
    ...over,
})

type Opts = {
    body?: Record<string, unknown>
    headers?: Record<string, string>
    method?: string
    user?: typeof USER | null
    plan?: unknown
    coupon?: Coupon | null
    mp?: { status?: number; body: unknown }
    mlToken?: string
    extra?: Parameters<typeof createFakeSupabase>[0]
}

async function call(o: Opts = {}) {
    const fake = createFakeSupabase({
        'plans.select': { data: o.plan === undefined ? PLAN : o.plan },
        'coupons.select': o.coupon === null ? { error: { message: 'none' } } : { data: o.coupon ?? coupon() },
        'subscriptions.insert': { data: { id: 'sub-1' } },
        ...o.extra,
    })
    const user = o.user === undefined ? USER : o.user
    const userClient = { auth: { getUser: () => Promise.resolve({ data: { user }, error: user ? null : new Error('bad') }) } }
    let n = 0
    const handler = createHandler(() => (n++ === 0 ? userClient : fake.client))

    const mpCalls: { url: string; headers: Headers; body: any }[] = []
    const original = globalThis.fetch
    globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
        mpCalls.push({ url: String(input), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) })
        const r = o.mp ?? { body: { id: 'mp-1' } }
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status ?? 200 }))
    }) as typeof fetch

    const envBefore = Deno.env.get('ML_ACCESS_TOKEN')
    Deno.env.set('ML_ACCESS_TOKEN', o.mlToken ?? 'ml-token')
    if (o.mlToken === '') Deno.env.delete('ML_ACCESS_TOKEN')
    const err = console.error
    console.error = () => {}
    try {
        const res = await handler(new Request('http://x/create-subscription', {
            method: o.method ?? 'POST',
            headers: o.headers ?? { Authorization: 'Bearer t' },
            body: o.method === 'OPTIONS' ? undefined : JSON.stringify(o.body ?? { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'card', cardTokenId: 'tok' }),
        }))
        return { res, json: await res.json().catch(() => null), fake, mpCalls }
    } finally {
        console.error = err
        globalThis.fetch = original
        envBefore === undefined ? Deno.env.delete('ML_ACCESS_TOKEN') : Deno.env.set('ML_ACCESS_TOKEN', envBefore)
    }
}

const amountOf = (r: Awaited<ReturnType<typeof call>>) => r.fake.callsFor('subscriptions', 'insert')[0].payload.transaction_amount

Deno.test('answers the CORS preflight', async () => {
    const { res } = await call({ method: 'OPTIONS' })
    assertEquals(res.status, 200)
})

Deno.test('401 without an authorization header', async () => {
    const { res } = await call({ headers: {} })
    assertEquals(res.status, 401)
})

Deno.test('500 when the Mercado Pago token is not configured', async () => {
    const { res, json } = await call({ mlToken: '' })
    assertEquals(res.status, 500)
    assertEquals(json.error, 'ML_ACCESS_TOKEN not configured')
})

Deno.test('401 for an invalid user', async () => {
    const { res } = await call({ user: null })
    assertEquals(res.status, 401)
})

Deno.test('400 when a required field is missing', async () => {
    for (const missing of ['planId', 'billingCycle', 'paymentMethod']) {
        const body: Record<string, unknown> = { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'card' }
        delete body[missing]
        const { res, mpCalls } = await call({ body })
        assertEquals(res.status, 400)
        assertEquals(mpCalls, [])
    }
})

Deno.test('400 when the plan does not exist', async () => {
    const { res, json, mpCalls } = await call({ plan: null })
    assertEquals(res.status, 400)
    assertEquals(json.error, 'Plano não encontrado')
    assertEquals(mpCalls, [])
})

Deno.test('charges the monthly or yearly price of the plan', async () => {
    const monthly = await call({ body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'card' } })
    const yearly = await call({ body: { planId: 'plan-1', billingCycle: 'yearly', paymentMethod: 'card' } })
    assertEquals(amountOf(monthly), 10)
    assertEquals(amountOf(yearly), 100)
    assertEquals(monthly.mpCalls[0].body.auto_recurring.frequency, 1)
    assertEquals(yearly.mpCalls[0].body.auto_recurring.frequency, 12)
})

Deno.test('card: sends the preapproval to Mercado Pago and stores a pending subscription', async () => {
    const r = await call({ body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'card', cardTokenId: 'tok-9', deviceSessionId: 'dev-1' } })
    const [mp] = r.mpCalls
    assertEquals(mp.url, MP_PREAPPROVAL)
    assertEquals(mp.headers.get('Authorization'), 'Bearer ml-token')
    assertEquals(mp.headers.get('X-meli-session-id'), 'dev-1')
    assertEquals(mp.body, {
        reason: 'Assinatura PRÓ - PRÓ',
        external_reference: 'user_user-1_plan_plan-1',
        payer_email: 'aluno@example.com',
        card_token_id: 'tok-9',
        back_url: 'https://semeandodevs.com.br/app/home',
        auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: 10, currency_id: 'BRL' },
        status: 'authorized',
    })
    assertEquals(r.json, { status: 'pending', preapproval_id: 'mp-1', subscription_id: 'sub-1' })
    assertEquals(r.fake.callsFor('subscriptions', 'insert')[0].payload, {
        user_id: 'user-1',
        plan_id: 'plan-1',
        coupon_id: null,
        mp_preapproval_id: 'mp-1',
        billing_cycle: 'monthly',
        transaction_amount: 10,
        status: 'pending',
    })
    assertEquals(r.fake.callsFor('profiles'), [])
})

Deno.test('card: omits the device session header when none is sent', async () => {
    const r = await call()
    assertEquals(r.mpCalls[0].headers.has('X-meli-session-id'), false)
})

Deno.test('card: a Mercado Pago error returns 500 and stores nothing', async () => {
    const r = await call({ mp: { status: 400, body: { message: 'card rejected' } }, body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'card', couponCode: 'X' } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json, { error: 'Erro ao processar pagamento.', details: 'card rejected' })
    assertEquals(r.fake.callsFor('subscriptions', 'insert'), [])
    assertEquals(r.fake.callsFor('coupons', 'update'), [])
})

Deno.test('pix: creates the payment and returns the QR code', async () => {
    const r = await call({
        body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'pix' },
        mp: { body: { id: 555, point_of_interaction: { transaction_data: { qr_code: 'qr', qr_code_base64: 'b64' } } } },
    })
    const [mp] = r.mpCalls
    assertEquals(mp.url, MP_PAYMENTS)
    assertEquals(mp.body, {
        transaction_amount: 10,
        description: 'Assinatura PRÓ - PRÓ',
        payment_method_id: 'pix',
        payer: { email: 'aluno@example.com' },
        external_reference: 'user_user-1_plan_plan-1',
    })
    assertEquals(mp.headers.get('X-Idempotency-Key')?.length, 36)
    assertEquals(r.json, { status: 'pending', payment_id: 555, qr_code: 'qr', qr_code_base64: 'b64', subscription_id: 'sub-1' })
    assertEquals(r.fake.callsFor('subscriptions', 'insert')[0].payload.mp_preapproval_id, '555')
})

Deno.test('pix: a Mercado Pago error returns 500 and stores nothing', async () => {
    const r = await call({ body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'pix' }, mp: { status: 400, body: { error: 'bad' } } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.details, 'bad')
    assertEquals(r.fake.callsFor('subscriptions', 'insert'), [])
})

Deno.test('a failing subscription insert becomes a 500', async () => {
    const r = await call({ extra: { 'subscriptions.insert': { error: new Error('insert failed') } } })
    assertEquals(r.res.status, 500)
    assertEquals(r.json.error, 'insert failed')
})

const withCoupon = (c: Coupon | null, billingCycle = 'monthly', code = 'PROMO') =>
    call({ coupon: c, body: { planId: 'plan-1', billingCycle, paymentMethod: 'card', couponCode: code } })

Deno.test('coupon: normalizes the code before looking it up', async () => {
    const r = await withCoupon(coupon(), 'monthly', '  promo20 ')
    assertEquals(r.fake.callsFor('coupons', 'select')[0].filters, [['eq', 'code', 'PROMO20']])
})

Deno.test('coupon: percentage discount applies to the monthly and yearly price', async () => {
    assertEquals(amountOf(await withCoupon(coupon({ discount_value: 20 }))), 8)
    assertEquals(amountOf(await withCoupon(coupon({ discount_value: 25 }), 'yearly')), 75)
})

Deno.test('coupon: fixed discount is subtracted from the monthly price', async () => {
    assertEquals(amountOf(await withCoupon(coupon({ discount_type: 'fixed', discount_value: 3 }))), 7)
})

Deno.test('coupon: fixed discount is per month on yearly billing, keeping the yearly discount factor', async () => {
    assertEquals(amountOf(await withCoupon(coupon({ discount_type: 'fixed', discount_value: 3 }), 'yearly')), 70)
})

Deno.test('coupon: the amount never goes below zero', async () => {
    assertEquals(amountOf(await withCoupon(coupon({ discount_type: 'fixed', discount_value: 50 }))), 0)
    assertEquals(amountOf(await withCoupon(coupon({ discount_type: 'fixed', discount_value: 50 }), 'yearly')), 0)
})

Deno.test('coupon: the amount is rounded to cents', async () => {
    const r = await call({
        plan: { ...PLAN, monthly_price: 19.99 },
        coupon: coupon({ discount_value: 15 }),
        body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'card', couponCode: 'P' },
    })
    assertEquals(amountOf(r), 16.99)
})

Deno.test('coupon: a valid coupon is linked to the subscription and its usage is incremented', async () => {
    const r = await withCoupon(coupon({ used_count: 4, usage_limit: 5 }))
    assertEquals(r.fake.callsFor('coupons', 'update')[0].payload, { used_count: 5 })
    assertEquals(r.fake.callsFor('coupons', 'update')[0].filters, [['eq', 'id', 'c-1']])
    assertEquals(r.fake.callsFor('subscriptions', 'insert')[0].payload.coupon_id, 'c-1')
})

Deno.test('coupon: unknown, expired, exhausted and wrong-cycle coupons are rejected before charging', async () => {
    const cases: [Coupon | null, string, string][] = [
        [null, 'monthly', 'Cupom não encontrado'],
        [coupon({ expiration_date: '2000-01-01T00:00:00Z' }), 'monthly', 'Cupom expirado'],
        [coupon({ usage_limit: 3, used_count: 3 }), 'monthly', 'Cupom atingiu o limite de uso'],
        [coupon({ valid_for_plan_type: 'monthly' }), 'yearly', 'Este cupom é válido apenas para o plano Mensal.'],
        [coupon({ valid_for_plan_type: 'yearly' }), 'monthly', 'Este cupom é válido apenas para o plano Anual.'],
    ]
    for (const [c, cycle, message] of cases) {
        const r = await withCoupon(c, cycle)
        assertEquals(r.res.status, 400)
        assertEquals(r.json.error, message)
        assertEquals(r.mpCalls, [])
        assertEquals(r.fake.callsFor('subscriptions', 'insert'), [])
    }
})

Deno.test('coupon: a future expiration date and an unlimited usage are accepted', async () => {
    const r = await withCoupon(coupon({ expiration_date: '2999-01-01T00:00:00Z', usage_limit: null, used_count: 999 }))
    assertEquals(r.res.status, 200)
})

Deno.test('an unsupported payment method is rejected instead of saving an unpaid subscription', async () => {
    const r = await call({ body: { planId: 'plan-1', billingCycle: 'monthly', paymentMethod: 'boleto' } })
    assertEquals(r.res.status, 400)
    assertEquals(r.fake.callsFor('subscriptions', 'insert'), [])
})

Deno.test('an unknown billing cycle is rejected instead of charging the yearly price', async () => {
    const r = await call({ body: { planId: 'plan-1', billingCycle: 'weekly', paymentMethod: 'card' } })
    assertEquals(r.res.status, 400)
})
