# Dispatch Newsletter

Edge Function that sends a newsletter to every profile with `newsletter_active = true`.
Triggered by the admin panel (`/admin/envio-de-newsletter`). The caller must send the access token of an admin user (`profiles.role = 'admin'`); other tokens get 401/403.

## Newsletter row

Create a row in `public.newsletter`:

| Column | Use |
| --- | --- |
| `subject` | Email subject (falls back to "Novidades do Semeando Devs!") |
| `body` | Required. Without `html`, it is placed (HTML allowed) inside the default Semeando Devs card, with the `cta_url` button and footer. With `html`, it is only the plain-text version |
| `html` | Optional complete email, sent as is (no default card around it) |

Inside `html` and `body`, the placeholder `{{nome_virgula}}` becomes `, Maria` (first name) or an empty string when the profile has no name, so `Oi{{nome_virgula}}!` works for everyone.

Designed emails live in `templates/` (e.g. `templates/curso-sql.html`).

## Behavior

- Recipients come from `profiles` (`email`, `name`) with `newsletter_active = true`.
- Profiles that already have `email_sent = true` for this newsletter are skipped, so a call can be repeated safely.
- Each call sends at most `max_per_run` emails (default 200) and reports `remaining`. Call again until `remaining` is 0. Failed sends stay pending.
- With `RESEND_API_KEY` set, emails go through Resend (about 600 ms between sends); otherwise through the SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER`).

## Usage

Everything is done from the admin panel:

- **Enviar teste**: sends the form content (saved or not) to a fixed address; records nothing. The function receives `test_email` plus an unsaved `draft` (`subject`, `body`, `html`, `cta_url`, `cta_label`) or a `newsletter_id`.
- **Salvar e enviar** / **Reenviar**: the panel calls the function in batches (`max_per_run`) until `remaining` is 0.
