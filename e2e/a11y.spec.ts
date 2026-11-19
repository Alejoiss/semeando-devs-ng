import { test, expect } from './support/test';
import { expectNoAxeViolations } from './support/axe';
import { storageStateFor } from './support/users';

const LESSON = '/app/s/html-essencial/ss/primeiros-passos/lesson/0fb4e367-514b-5e00-889c-e2c1b08d6efd';

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
        { path: '/termos-de-uso' },
    ],
    student: [
        { path: '/app' },
        { path: '/app/s/html-essencial' },
        { path: '/app/s/html-essencial/ss/primeiros-passos' },
        { path: LESSON },
        { path: '/app/ranking' },
        { path: '/app/conquistas' },
        { path: '/app/perfil' },
        { path: '/app/upgrade' },
        { path: '/app/gerenciar-assinatura' },
    ],
    admin: [
        { path: '/admin/dashboard' },
        { path: '/admin/lista-de-alunos' },
        { path: '/admin/cadastro-de-cupons' },
        { path: '/admin/cadastro-de-cupons/novo' },
        { path: '/admin/envio-de-newsletter' },
        { path: '/admin/envio-de-newsletter/novo' },
        { path: '/admin/relatorio-de-receita' },
        { path: '/admin/configuracoes-ia' },
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
                await page.waitForFunction(() =>
                    document.getAnimations().every(a => a.effect?.getComputedTiming().iterations === Infinity || a.playState === 'finished'),
                );
                await page.waitForTimeout(300);
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
