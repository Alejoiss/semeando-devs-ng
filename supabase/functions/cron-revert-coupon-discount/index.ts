// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        coupons (*),
        plans (*)
      `)
      .eq('status', 'active')
      .not('coupon_id', 'is', null);

    if (error) {
      throw error;
    }

    const now = new Date();
    const processed = [];
    const errors = [];

    for (const sub of subscriptions || []) {
      if (!sub.coupons || !sub.plans) continue;
      
      const durationMonths = sub.coupons.duration_months;
      if (!durationMonths) continue;

      const createdAt = new Date(sub.created_at);
      const expirationDate = new Date(createdAt);
      expirationDate.setMonth(expirationDate.getMonth() + durationMonths);

      if (now >= expirationDate) {
        const originalPrice = sub.billing_cycle === 'yearly' ? sub.plans.yearly_price : sub.plans.monthly_price;
        
        try {
          if (sub.mp_preapproval_id) {
            const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                auto_recurring: {
                  transaction_amount: originalPrice
                }
              })
            });

            if (!mpResponse.ok) {
              const mpError = await mpResponse.text();
              throw new Error(`MP API Error: ${mpResponse.status} - ${mpError}`);
            }
          }

          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ coupon_id: null })
            .eq('id', sub.id);

          if (updateError) {
            throw updateError;
          }

          processed.push(sub.id);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Failed to process subscription ${sub.id}:`, errorMessage);
          errors.push({ id: sub.id, error: errorMessage });
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Success', processed, errors }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Unhandled error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/cron-revert-coupon-discount' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
