# Dispatch Newsletter

Edge Function that sends a newsletter to every profile with `newsletter_active = true`.
There is no admin screen yet, so it is triggered with `curl`.

## Newsletter row

Create a row in `public.newsletter`:

| Column | Use |
| --- | --- |
| `subject` | Email subject (falls back to "Novidades do Semeando Devs!") |
| `body` | Plain-text version (always required) |
| `html` | Optional fully designed email. When empty, a simple template built from `body`, `cta_url` and `cta_label` is used |

Inside `html` and `body`, the placeholder `{{nome_virgula}}` becomes `, Maria` (first name) or an empty string when the profile has no name, so `Oi{{nome_virgula}}!` works for everyone.

Designed emails live in `templates/` (e.g. `templates/curso-sql.html`).

## Behavior

- Recipients come from `profiles` (`email`, `name`) with `newsletter_active = true`.
- Profiles that already have `email_sent = true` for this newsletter are skipped, so a call can be repeated safely.
- Each call sends at most `max_per_run` emails (default 200) and reports `remaining`. Call again until `remaining` is 0. Failed sends stay pending.
- With `RESEND_API_KEY` set, emails go through Resend (about 600 ms between sends); otherwise through the SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER`).

## Usage

1. Insert the newsletter row and note its UUID.
2. Send a test to yourself (records nothing):

```bash
curl -X POST "<SUPABASE_URL>/functions/v1/dispatch-newsletter" \
     -H "Authorization: Bearer <KEY>" \
     -H "Content-Type: application/json" \
     -d '{"newsletter_id": "<UUID>", "test_email": "you@example.com"}'
```

3. Send for real (repeat while `remaining` > 0):

```bash
curl -X POST "<SUPABASE_URL>/functions/v1/dispatch-newsletter" \
     -H "Authorization: Bearer <KEY>" \
     -H "Content-Type: application/json" \
     -d '{"newsletter_id": "<UUID>"}'
```

Use `http://127.0.0.1:54321` locally. Optional `max_per_run` lowers or raises the batch size.
