import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { newsletter_id } = await req.json();
        if (!newsletter_id) {
            return new Response(JSON.stringify({ error: 'newsletter_id is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch newsletter
        const { data: newsletter, error: newsletterError } = await supabase
            .from('newsletter')
            .select('*')
            .eq('id', newsletter_id)
            .single();

        if (newsletterError || !newsletter) {
            return new Response(JSON.stringify({ error: 'Newsletter not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id')
            .eq('newsletter_active', true);

        if (profilesError) throw profilesError;

        // Fetch users to get emails (for demo purposes we use listUsers)
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;

        const subscriberIds = new Set(profiles.map((p) => p.id));
        const subscribers = users.filter((u) => subscriberIds.has(u.id));

        const records = [];

        // SMTP & Resend configuration
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const smtpHost = Deno.env.get('SMTP_HOST') || 'host.docker.internal';
        const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '54325', 10);
        const smtpUser = Deno.env.get('SMTP_USER') || '';
        const smtpPass = Deno.env.get('SMTP_PASS') || '';
        const smtpSender = Deno.env.get('SMTP_SENDER') || 'Semeando Devs <noreply@semeandodevs.com.br>';

        let transporter: any = null;
        if (!resendApiKey) {
            transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: smtpUser && smtpPass ? {
                    user: smtpUser,
                    pass: smtpPass,
                } : undefined,
                tls: {
                    rejectUnauthorized: false
                }
            });
        }

        for (const user of subscribers) {
            let emailSent = false;
            try {
                let htmlContent = `
                    <div style="font-family: sans-serif; background-color: #060e20; color: #dee5ff; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #3fc2fb; margin-top: 0;">Informativo Semeando Devs</h2>
                        <div style="margin-bottom: 24px; line-height: 1.6;">
                            ${newsletter.body.replace(/\n/g, '<br>')}
                        </div>
                `;

                if (newsletter.cta_url) {
                    htmlContent += `
                        <div style="margin-top: 24px; margin-bottom: 24px;">
                            <a href="${newsletter.cta_url}" style="background: linear-gradient(135deg, #3fc2fb, #27b4ed); color: #060e20; padding: 12px 24px; border-radius: 16px; text-decoration: none; font-weight: bold; display: inline-block;">
                                ${newsletter.cta_label || 'Acesse'}
                            </a>
                        </div>
                    `;
                }

                htmlContent += `
                        <hr style="border: 0; border-top: 1px solid #141f38; margin: 24px 0;" />
                        <p style="font-size: 12px; color: #fe69ac;">Semeando Devs: Transformando o aprendizado de tecnologia em uma jornada de alto impacto.</p>
                    </div>
                `;

                if (resendApiKey) {
                    // Send via Resend API
                    const response = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${resendApiKey}`
                        },
                        body: JSON.stringify({
                            from: smtpSender,
                            to: user.email,
                            subject: 'Novidades do Semeando Devs!',
                            html: htmlContent
                        })
                    });

                    if (!response.ok) {
                        const errBody = await response.text();
                        throw new Error(`Resend API response error (${response.status}): ${errBody}`);
                    }
                    emailSent = true;
                    console.log(`[Email] Sent newsletter '${newsletter.id}' to ${user.email} via Resend API`);
                } else {
                    // Fallback to local SMTP (Nodemailer)
                    await transporter.sendMail({
                        from: smtpSender,
                        to: user.email,
                        subject: 'Novidades do Semeando Devs!',
                        html: htmlContent,
                        text: `${newsletter.body}${newsletter.cta_url ? `\n\n${newsletter.cta_label || 'Acesse'}: ${newsletter.cta_url}` : ''}`
                    });
                    emailSent = true;
                    console.log(`[Email] Sent newsletter '${newsletter.id}' to ${user.email} via local SMTP`);
                }
            } catch (mailError) {
                console.error(`[Email] Failed to send newsletter '${newsletter.id}' to ${user.email}:`, mailError);
            }

            records.push({
                user_id: user.id,
                newsletter_id: newsletter.id,
                email_sent: emailSent,
            });
        }

        // Record user_newsletter
        if (records.length > 0) {
            const { error: insertError } = await supabase
                .from('user_newsletter')
                .upsert(records);

            if (insertError) throw insertError;
        }

        return new Response(
            JSON.stringify({ success: true, sent_count: records.length }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
