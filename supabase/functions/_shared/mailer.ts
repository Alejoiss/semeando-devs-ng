export type Mailer = { createTransport: (options: any) => any }

export interface Email {
    to: string[]
    subject: string
    html: string
    text: string
}

/** Sends through Resend when RESEND_API_KEY is set, otherwise through the SMTP variables (same setup as dispatch-newsletter). */
export async function sendEmail(email: Email, nodemailer: Mailer): Promise<void> {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const sender = Deno.env.get('SMTP_SENDER') || 'Semeando Devs <noreply@semeandodevs.com.br>'

    if (resendApiKey) {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
            body: JSON.stringify({ from: sender, ...email }),
        })
        if (!response.ok) {
            throw new Error(`Resend API response error (${response.status}): ${await response.text()}`)
        }
        return
    }

    const port = parseInt(Deno.env.get('SMTP_PORT') || '54325', 10)
    const user = Deno.env.get('SMTP_USER') || ''
    const pass = Deno.env.get('SMTP_PASS') || ''
    const transporter = nodemailer.createTransport({
        host: Deno.env.get('SMTP_HOST') || 'host.docker.internal',
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
        tls: { rejectUnauthorized: false },
    })
    await transporter.sendMail({ from: sender, ...email, to: email.to.join(', ') })
}
