type CreateClient = (url: string, key: string, options?: any) => any

export function createHandler(createClient: CreateClient) {
    return async (_req: Request): Promise<Response> => {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
        const mpAccessToken = Deno.env.get('ML_ACCESS_TOKEN')

        if (!mpAccessToken) {
            console.error('ML_ACCESS_TOKEN is not configured')
            return new Response(
                JSON.stringify({ error: 'ML_ACCESS_TOKEN is not configured' }),
                { headers: { "Content-Type": "application/json" }, status: 500 },
            )
        }

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
    }
}
