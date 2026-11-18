import { test, expect } from './support/test';
import { expectNoAxeViolations } from './support/axe';
import { storageStateFor } from './support/users';

const LESSON = '/app/s/html-essencial/ss/primeiros-passos/lesson/0fb4e367-514b-5e00-889c-e2c1b08d6efd';
const DOTS = 'a11y-daily-progress-dots-aria-label';
const MUTED = 'a11y-muted-text-contrast';
const LOGOUT = 'a11y-sidebar-logout-contrast';

interface Scan {
    path: string;
    findings?: string[];
}

const SCANS: Record<'anonymous' | 'student' | 'admin', Scan[]> = {
    anonymous: [
        { path: '/' },
        { path: '/cursos' },
        { path: '/cursos/html-essencial' },
        { path: '/cursos/html-essencial/primeiros-passos/o-que-e-html' },
        { path: '/auth/login' },
        { path: '/auth/register' },
        { path: '/recuperar-senha' },
        { path: '/support/contact' },
        { path: '/rota-inexistente' },
        { path: '/termos-de-uso', findings: ['a11y-terms-badges-contrast'] },
    ],
    student: [
        { path: '/app', findings: [DOTS, MUTED] },
        { path: '/app/s/html-essencial', findings: [DOTS, MUTED] },
        { path: '/app/s/html-essencial/ss/primeiros-passos', findings: [DOTS, MUTED] },
        { path: LESSON, findings: [DOTS, MUTED] },
        { path: '/app/ranking', findings: [DOTS, MUTED] },
        { path: '/app/conquistas', findings: [DOTS, MUTED] },
        { path: '/app/perfil', findings: [DOTS, MUTED, 'a11y-readonly-input-without-label'] },
        { path: '/app/upgrade', findings: [DOTS, MUTED] },
        { path: '/app/gerenciar-assinatura', findings: [DOTS, MUTED] },
    ],
    admin: [
        { path: '/admin/dashboard', findings: [LOGOUT] },
        { path: '/admin/lista-de-alunos', findings: [LOGOUT] },
        { path: '/admin/cadastro-de-cupons', findings: [LOGOUT] },
        { path: '/admin/cadastro-de-cupons/novo', findings: [LOGOUT] },
        { path: '/admin/envio-de-newsletter', findings: [LOGOUT] },
        { path: '/admin/envio-de-newsletter/novo', findings: [LOGOUT] },
        { path: '/admin/relatorio-de-receita', findings: [LOGOUT] },
    ],
};

// O app só tem tema escuro (color-scheme: dark), então não há varredura no tema claro
for (const [audience, scans] of Object.entries(SCANS)) {
    test.describe(`AXE (WCAG 2.2 AA) · ${audience}`, () => {
        if (audience !== 'anonymous') {
            test.use({ storageState: storageStateFor(audience as 'student' | 'admin') });
        }

        for (const { path, findings } of scans) {
            const run = async ({ page }: { page: import('@playwright/test').Page }) => {
                await page.goto(path);
                await expect(page.getByRole('heading').first()).toBeVisible();
                await page.waitForTimeout(1500);
                await expectNoAxeViolations(page, { exclude: ['iframe'] });
            };
            if (findings) {
                test.fixme(`finding ${findings.join(' + ')}: ${path} has no violations`, run);
            } else {
                test(`${path} has no violations`, run);
            }
        }
    });
}
