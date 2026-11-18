import type { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { sql } from './support/backend';
import { E2E_USERS, storageStateFor } from './support/users';

const userId = E2E_USERS.subscriber.id;
const PLAN_ID = 'c5efafcb-3467-4e73-9792-9ed70585971e';
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
const FAKE_SDK = `window.MercadoPago = function () {
    this.fields = { create: () => ({ mount: () => ({ on() {} }) }), createCardToken: async () => ({ id: 'tok_e2e' }) };
};`;

// O SDK real do Mercado Pago nunca é carregado e nenhuma chamada a create-subscription pode sair destes testes
async function guardPayments(page: Page) {
    const paymentCalls: string[] = [];
    await page.route('https://sdk.mercadopago.com/**', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SDK }));
    await page.route('**/functions/v1/create-subscription', route => {
        paymentCalls.push(route.request().url());
        return route.abort();
    });
    return paymentCalls;
}

function insertSubscription(status: string, extra = ''): string {
    return sql(
        `insert into subscriptions (user_id, plan_id, mp_preapproval_id, billing_cycle, transaction_amount, status, access_until)
         values ('${userId}', '${PLAN_ID}', 'e2e-preapproval', 'monthly', 29.90, '${status}', now() + interval '30 days') ${extra}
         returning id`,
    ).split('\n')[0];
}

test.describe('billing (Mercado Pago never reached)', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: storageStateFor('subscriber') });

    test.beforeEach(() => {
        sql(`delete from subscriptions where user_id = '${userId}'`);
        sql(`delete from coupons where code like 'E2E%'`);
        sql(`update profiles set is_pro = false, pro_until = null where id = '${userId}'`);
        sql(`insert into coupons (code, discount_type, discount_value, duration_months) values ('E2E10', 'percentage', 10, null), ('E2E100', 'percentage', 100, 3)`);
    });

    test('plans lead to the checkout summary and card form without submitting a payment', async ({ page }) => {
        const paymentCalls = await guardPayments(page);
        await page.goto('/app/upgrade');
        await expect(page.getByText('R$ 29,90').first()).toBeVisible();
        await expect(page.getByText('R$ 299,00').first()).toBeVisible();

        await page.getByRole('button', { name: 'Assinar Agora' }).first().click();
        await expect(page).toHaveURL(new RegExp(`/app/checkout\\?planId=${PLAN_ID}&cycle=monthly$`));
        await expect(page.getByRole('heading', { level: 1, name: 'Finalizar Assinatura' })).toBeVisible();
        await expect(page.getByText('Plano PRÓ', { exact: true })).toBeVisible();
        await expect(page.getByText('Mensal', { exact: true })).toBeVisible();
        await expect(page.getByText('R$ 29,90')).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'NOME DO TITULAR' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Confirmar Pagamento' })).toBeVisible();
        await expect(page.getByText(/Erro ao carregar o processador de pagamentos/)).toHaveCount(0);

        expect(paymentCalls).toEqual([]);
    });

    test('the yearly plan opens the checkout with the yearly total', async ({ page }) => {
        const paymentCalls = await guardPayments(page);
        await page.goto('/app/upgrade');
        await page.getByRole('button', { name: 'Assinar Plano Anual' }).click();

        await expect(page).toHaveURL(/cycle=yearly$/);
        await expect(page.getByText('Anual', { exact: true })).toBeVisible();
        await expect(page.getByText('R$ 299,00')).toBeVisible();
        expect(paymentCalls).toEqual([]);
    });

    test('a percentage coupon discounts the price on the plans and in the checkout', async ({ page }) => {
        const paymentCalls = await guardPayments(page);
        await page.goto('/app/upgrade');
        await page.getByLabel('Tem um cupom de desconto?').fill('e2e10');
        await page.getByRole('button', { name: 'Aplicar' }).click();

        await expect(page.getByText('Cupom aplicado:')).toContainText('E2E10');
        await expect(page.getByText('R$ 26,91')).toBeVisible();

        await page.getByRole('button', { name: 'Assinar Agora' }).first().click();
        await expect(page).toHaveURL(/couponCode=E2E10/);
        await expect(page.getByText('R$ 26,91')).toBeVisible();
        expect(paymentCalls).toEqual([]);
    });

    test('an unknown coupon is rejected', async ({ page }) => {
        await page.goto('/app/upgrade');
        await page.getByLabel('Tem um cupom de desconto?').fill('E2E-NAO-EXISTE');
        await page.getByRole('button', { name: 'Aplicar' }).click();

        await expect(page.getByText('Cupom inválido ou expirado')).toBeVisible();
        await expect(page.getByText('Cupom aplicado:')).toHaveCount(0);
    });

    test('a 100% coupon activates Pro without any payment', async ({ page }) => {
        const paymentCalls = await guardPayments(page);
        await page.goto('/app/upgrade');
        await page.getByLabel('Tem um cupom de desconto?').fill('E2E100');
        await page.getByRole('button', { name: 'Aplicar' }).click();
        await page.getByRole('button', { name: 'Ativar Plano Pró' }).first().click();

        await expect(page.getByRole('heading', { name: 'Confirmar Ativação' })).toBeVisible();
        await page.getByRole('button', { name: 'Sim, Ativar PRÓ Agora' }).click();

        await expect(page).toHaveURL(/\/app\/gerenciar-assinatura$/);
        await expect.poll(() => sql(`select is_pro from profiles where id = '${userId}'`)).toBe('t');
        expect(sql(`select pro_until > now() + interval '2 months' from profiles where id = '${userId}'`)).toBe('t');
        expect(sql(`select used_count from coupons where code = 'E2E100'`)).toBe('1');
        expect(paymentCalls).toEqual([]);
    });

    test('the pending screen turns into a success once the webhook activates the subscription', async ({ page }) => {
        const subscriptionId = insertSubscription('pending');
        const pixImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

        await page.goto(`/app/aguardando-pagamento?sid=${subscriptionId}&method=pix&qr_code=00020126E2E&qr_code_base64=${pixImage}`);
        await expect(page.getByRole('heading', { level: 1, name: 'Aguardando Confirmação' })).toBeVisible();
        await expect(page.getByAltText('QR Code PIX')).toBeVisible();
        await expect(page.getByRole('textbox')).toHaveValue('00020126E2E');
        await expect(page.getByRole('dialog')).toHaveCount(0);

        await expect
            .poll(
                async () => {
                    sql(`update subscriptions set status = 'active' where id = '${subscriptionId}'`);
                    sql(`update profiles set is_pro = true, pro_until = now() + interval '30 days' where id = '${userId}'`);
                    return page.getByRole('dialog').count();
                },
                { message: 'the realtime update opens the success dialog', timeout: 20_000 },
            )
            .toBe(1);
        await expect(page.getByRole('heading', { name: 'Pagamento Aprovado!' })).toBeVisible();

        await page.getByRole('button', { name: /Começar agora/ }).click();
        await expect(page).toHaveURL(/\/app\/gerenciar-assinatura$/);
        await expect(page.getByRole('heading', { name: /PRÓ/ })).toBeVisible();
    });

    test('an active subscription can be cancelled (Mercado Pago stubbed)', async ({ page }) => {
        const subscriptionId = insertSubscription('active');
        sql(`update profiles set is_pro = true, pro_until = now() + interval '30 days' where id = '${userId}'`);

        const cancelBodies: Record<string, string>[] = [];
        await page.route('**/functions/v1/cancel-subscription', route => {
            const request = route.request();
            if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
            cancelBodies.push(request.postDataJSON());
            sql(`update subscriptions set status = 'cancelled' where id = '${subscriptionId}'`);
            return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });
        page.once('dialog', dialog => dialog.accept());

        await page.goto('/app/gerenciar-assinatura');
        await expect(page.getByRole('heading', { name: 'Zona de Perigo' })).toBeVisible();
        await expect(page.getByText('R$ 29,90')).toBeVisible();

        await page.getByRole('button', { name: 'Cancelar Assinatura' }).click();

        await expect.poll(() => cancelBodies).toEqual([{ subscriptionId }]);
        await expect(page.getByRole('heading', { name: 'Gerenciar Assinatura' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Zona de Perigo' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Cancelar Assinatura' })).toHaveCount(0);
    });
});
