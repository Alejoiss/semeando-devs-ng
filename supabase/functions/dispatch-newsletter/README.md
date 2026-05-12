# Dispatch Newsletter

This Edge Function orchestrates the sending of newsletters to users who have opted in.
Since there is no administrative panel in the frontend application yet, you must trigger this function manually via `curl` to dispatch a specific newsletter.

## Usage

1. Create a row in the `newsletter` table in Supabase.
2. Get the UUID of the newly created newsletter.
3. Trigger the function using the example below.

### Example cURL Request

```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/dispatch-newsletter" \
     -H "Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"newsletter_id": "YOUR_NEWSLETTER_UUID_HERE"}'
```

*(Note: Replace the local URL with your production Supabase Edge Function URL when running in production, and use the appropriate API key).*
