import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { ShowcaseCourse } from '../../services/public-catalog/public-catalog';

export interface Promo {
    code: string;
    title: string;
    detail: string;
}

interface PromoWindow extends Promo {
    endsAt: Date;
}

// Datas em horário de Brasília (UTC-3). Cada cupom é criado no banco pelo admin; esta lista só controla a divulgação.
const PROMOS: (PromoWindow & { startsAt: Date })[] = [
    {
        code: 'BLACKFRIDAY2026',
        title: 'Até 30/11: 1º mês do PRÓ mensal grátis',
        detail: 'Crie sua conta, abra a página do plano PRÓ e aplique o código.',
        startsAt: new Date('2026-11-23T00:00:00-03:00'),
        endsAt: new Date('2026-12-01T00:00:00-03:00'),
    },
    {
        code: 'FIMDEANO',
        title: 'Comece 2027 programando: 1º mês do PRÓ mensal grátis até 31/12',
        detail: 'Crie sua conta, abra a página do plano PRÓ e aplique o código.',
        startsAt: new Date('2026-12-01T00:00:00-03:00'),
        endsAt: new Date('2027-01-01T00:00:00-03:00'),
    },
];

export function activePromo(now: Date): Promo | null {
    const promo = PROMOS.find(p => now >= p.startsAt && now < p.endsAt);
    return promo ? { code: promo.code, title: promo.title, detail: promo.detail } : null;
}

@Component({
    selector: 'app-start-here',
    standalone: true,
    imports: [RouterLink, Header, Footer],
    templateUrl: './start-here.html',
    styleUrls: ['./start-here.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartHere {
    protected readonly courses = signal<ShowcaseCourse[]>(
        (inject(ActivatedRoute).snapshot.data['courses'] ?? []).filter((c: ShowcaseCourse) => !c.inRevision)
    );
    protected readonly promo = signal<Promo | null>(null);
    protected readonly copied = signal(false);
    protected readonly openFaq = signal<number | null>(null);

    protected readonly steps = [
        { icon: 'menu_book', title: 'Leia a aula', text: 'Texto curto e direto ao ponto, com material extra quando precisa.' },
        { icon: 'quiz', title: 'Faça o quiz', text: '10 perguntas. Errou? A resposta certa aparece com a justificativa. Acertando 7, você avança.' },
        { icon: 'code', title: 'Encare o desafio', text: 'Escreva código no editor do VS Code dentro do navegador e receba feedback de IA.' },
    ];

    protected readonly faq = [
        { q: 'Preciso saber alguma coisa antes?', a: 'Não. O curso de HTML é indicado para quem nunca programou, e Python para iniciantes também começa do zero.' },
        { q: 'Preciso instalar algo?', a: 'Não. As aulas, os quizzes e o editor de código rodam no navegador.' },
        { q: 'Como pago o PRÓ?', a: 'Pelo Mercado Pago, com cartão de crédito. Você cancela quando quiser em "Gerenciar assinatura" e continua PRÓ até o fim do período pago. Não há reembolso.' },
        { q: 'A IA corrige meu código?', a: 'Ela lê o enunciado e o seu código e dá um feedback sobre o que melhorar. Ela não executa testes. Cada envio usa 1 crédito do seu limite diário.' },
    ];

    constructor() {
        // A página é pré-renderizada no build: a promoção é decidida no navegador, com a data de quem visita.
        afterNextRender(() => this.promo.set(activePromo(new Date())));
    }

    protected toggleFaq(index: number) {
        this.openFaq.update(open => (open === index ? null : index));
    }

    protected async copyCode(code: string) {
        try {
            await navigator.clipboard.writeText(code);
            this.copied.set(true);
            setTimeout(() => this.copied.set(false), 2000);
        } catch {
            this.copied.set(false);
        }
    }
}
