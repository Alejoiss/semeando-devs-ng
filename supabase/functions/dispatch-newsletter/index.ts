import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

        for (const user of subscribers) {
            // Mock email send
            console.log(`[Email] Sending newsletter '${newsletter.id}' to ${user.email}`);
            console.log(`[Email] Content: ${newsletter.body}`);
            if (newsletter.cta_url) {
                console.log(`[Email] CTA: ${newsletter.cta_label} -> ${newsletter.cta_url}`);
            }

            records.push({
                user_id: user.id,
                newsletter_id: newsletter.id,
                email_sent: true,
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
