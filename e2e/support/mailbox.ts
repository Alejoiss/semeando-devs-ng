import { expect } from '@playwright/test';

const MAIL_API = process.env['E2E_MAIL_URL'] ?? 'http://127.0.0.1:54424';

interface MailSummary {
    ID: string;
    Subject: string;
}

export async function waitForEmailLink(email: string, subject: RegExp): Promise<string> {
    let link = '';
    await expect
        .poll(
            async () => {
                const search = await fetch(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
                if (!search.ok) return '';
                const { messages } = (await search.json()) as { messages: MailSummary[] };
                const mail = messages.find(item => subject.test(item.Subject));
                if (!mail) return '';
                const detail = (await (await fetch(`${MAIL_API}/api/v1/message/${mail.ID}`)).json()) as { HTML: string };
                link = detail.HTML.match(/href="([^"]+)"/)?.[1].replaceAll('&amp;', '&') ?? '';
                return link;
            },
            { timeout: 15_000, message: `no email matching ${subject} for ${email}` },
        )
        .not.toBe('');
    return link;
}
