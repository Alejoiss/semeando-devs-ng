import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGE_SIZE = 1000;
const DEFAULT_MAX_PER_RUN = 200;
const RESEND_DELAY_MS = 600;

interface Recipient {
    id: string;
    email: string;
    name: string | null;
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const firstName = (name: string | null) => (name ?? '').trim().split(/\s+/)[0] ?? '';

const buildDefaultHtml = (newsletter: any) => {
    let html = `
        <div style="font-family: sans-serif; background-color: #060e20; color: #dee5ff; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3fc2fb; margin-top: 0;">Informativo Semeando Devs</h2>
            <div style="margin-bottom: 24px; line-height: 1.6;">
                ${newsletter.body.replace(/\n/g, '<br>')}
            </div>
    `;

    if (newsletter.cta_url) {
        html += `
            <div style="margin-top: 24px; margin-bottom: 24px;">
                <a href="${escapeHtml(newsletter.cta_url)}" style="background: linear-gradient(135deg, #3fc2fb, #27b4ed); color: #060e20; padding: 12px 24px; border-radius: 16px; text-decoration: none; font-weight: bold; display: inline-block;">
                    ${escapeHtml(newsletter.cta_label || 'Acesse')}
                </a>
            </div>
        `;
    }

    html += `
            <p style="font-size: 12px; color: #fe69ac; margin-top: 24px;">Semeando Devs: Transformando o aprendizado de tecnologia em uma jornada de alto impacto.</p>
        </div>
    `;
    return html;
};

const renderHtml = (newsletter: any, recipient: Recipient) => {
    const template: string = newsletter.html || buildDefaultHtml(newsletter);
    const name = firstName(recipient.name);
    return template.replaceAll('{{nome_virgula}}', name ? `, ${escapeHtml(name)}` : '');
};

const renderText = (newsletter: any, recipient: Recipient) => {
    const name = firstName(recipient.name);
    let body = newsletter.body.replaceAll('{{nome_virgula}}', name ? `, ${name}` : '');
    if (/<[a-z][\s\S]*>/i.test(body)) {
        body = body
            .replace(/<(br|\/p|\/div|\/li|\/h\d)\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    return `${body}${newsletter.cta_url ? `\n\n${newsletter.cta_label || 'Acesse'}: ${newsletter.cta_url}` : ''}`;
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
        if (!token) {
            return json({ error: 'Unauthorized' }, 401);
        }

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) {
            return json({ error: 'Unauthorized' }, 401);
        }

        const { data: caller } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.user.id)
            .maybeSingle();
        if (caller?.role !== 'admin') {
            return json({ error: 'Forbidden' }, 403);
        }

        const { newsletter_id, test_email, max_per_run, draft } = await req.json();

        // A test can carry an unsaved draft, so the admin panel can preview delivery before saving.
        let newsletter: any;
        if (test_email && draft && typeof draft.body === 'string') {
            newsletter = {
                id: 'draft',
                subject: draft.subject ?? null,
                body: draft.body,
                html: draft.html ?? null,
                cta_url: draft.cta_url ?? null,
                cta_label: draft.cta_label ?? null,
            };
        } else {
            if (!newsletter_id) {
                return json({ error: 'newsletter_id is required' }, 400);
            }

            const { data, error: newsletterError } = await supabase
                .from('newsletter')
                .select('*')
                .eq('id', newsletter_id)
                .single();

            if (newsletterError || !data) {
                return json({ error: 'Newsletter not found' }, 404);
            }
            newsletter = data;
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const smtpHost = Deno.env.get('SMTP_HOST') || 'host.docker.internal';
        const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '54325', 10);
        const smtpUser = Deno.env.get('SMTP_USER') || '';
        const smtpPass = Deno.env.get('SMTP_PASS') || '';
        const smtpSender = Deno.env.get('SMTP_SENDER') || 'Semeando Devs <noreply@semeandodevs.com.br>';
        const subject = newsletter.subject || 'Novidades do Semeando Devs!';

        let transporter: any = null;
        if (!resendApiKey) {
            transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
                tls: { rejectUnauthorized: false },
            });
        }

        const deliver = async (recipient: Recipient) => {
            const html = renderHtml(newsletter, recipient);
            const text = renderText(newsletter, recipient);

            if (resendApiKey) {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({ from: smtpSender, to: recipient.email, subject, html, text }),
                });
                if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`Resend API response error (${response.status}): ${errBody}`);
                }
                await sleep(RESEND_DELAY_MS);
            } else {
                await transporter.sendMail({ from: smtpSender, to: recipient.email, subject, html, text });
            }
        };

        // Test mode: sends one email, records nothing and ignores the subscriber list.
        if (test_email) {
            await deliver({ id: 'test', email: test_email, name: 'Teste' });
            console.log(`[Email] Sent TEST newsletter '${newsletter.id}' to ${test_email}`);
            return json({ success: true, test: true, to: test_email });
        }

        const { data: alreadySent, error: sentError } = await supabase
            .from('user_newsletter')
            .select('user_id')
            .eq('newsletter_id', newsletter.id)
            .eq('email_sent', true);
        if (sentError) throw sentError;
        const sentIds = new Set((alreadySent ?? []).map((row) => row.user_id));

        const pending: Recipient[] = [];
        for (let from = 0; ; from += PAGE_SIZE) {
            const { data: page, error: pageError } = await supabase
                .from('profiles')
                .select('id, email, name')
                .eq('newsletter_active', true)
                .not('email', 'is', null)
                .order('id')
                .range(from, from + PAGE_SIZE - 1);
            if (pageError) throw pageError;

            for (const profile of page ?? []) {
                if (!sentIds.has(profile.id)) pending.push(profile as Recipient);
            }
            if (!page || page.length < PAGE_SIZE) break;
        }

        const limit = Number.isInteger(max_per_run) && max_per_run > 0 ? max_per_run : DEFAULT_MAX_PER_RUN;
        const batch = pending.slice(0, limit);
        const records = [];
        let failed = 0;

        for (const recipient of batch) {
            let emailSent = false;
            try {
                await deliver(recipient);
                emailSent = true;
                console.log(`[Email] Sent newsletter '${newsletter.id}' to ${recipient.email}`);
            } catch (mailError) {
                failed++;
                console.error(`[Email] Failed to send newsletter '${newsletter.id}' to ${recipient.email}:`, mailError);
            }

            records.push({
                user_id: recipient.id,
                newsletter_id: newsletter.id,
                email_sent: emailSent,
            });
        }

        if (records.length > 0) {
            const { error: insertError } = await supabase
                .from('user_newsletter')
                .upsert(records);
            if (insertError) throw insertError;
        }

        return json({
            success: true,
            sent_count: records.length - failed,
            failed_count: failed,
            remaining: pending.length - batch.length,
        });
    } catch (error: any) {
        return json({ error: error.message }, 500);
    }
});
