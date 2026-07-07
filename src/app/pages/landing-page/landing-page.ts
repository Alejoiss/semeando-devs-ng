import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MarkdownModule } from 'ngx-markdown';

import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { CommonModule } from '@angular/common';
import { ModuleService } from '../../services/module';
import { Module } from '../../../models/module/module';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [CommonModule, RouterModule, Footer, Header, MarkdownModule],
    templateUrl: './landing-page.html',
    styleUrls: ['./landing-page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements OnInit {
    private readonly moduleService = inject(ModuleService);
    protected readonly modules = signal<Module[]>([]);
    protected readonly activeMethodology = signal<'teoria' | 'revisao' | 'desafio'>('teoria');

    protected readonly methodologyImages = {
        'teoria': 'assets/screens/teoria_e_quiz.png',
        'revisao': 'assets/screens/revisao_inteligente.png',
        'desafio': 'assets/screens/desafios_de_codigo.png'
    };

    protected readonly mockRanking = signal([
        { position: 1, name: 'Você', xp: '8.450', isCurrentUser: true },
        { position: 2, name: 'Ana Silva', xp: '7.200', isCurrentUser: false },
        { position: 3, name: 'Carlos Dev', xp: '6.850', isCurrentUser: false },
        { position: 4, name: 'João Santos', xp: '5.900', isCurrentUser: false },
        { position: 5, name: 'Maria Dev', xp: '4.100', isCurrentUser: false },
    ]);

    protected readonly faqItems = signal([
        {
            question: 'O que é o Semeando Devs?',
            answer: 'É a sua nova forma de aprender programação: aulas curtas, quizzes interativos, desafios de código e um ranking que transforma estudo em competição saudável – tudo inspirado na experiência de outras plataformas já consolidadas no mercado.',
            expanded: false
        },
        {
            question: 'Para quem a plataforma foi criada?',
            answer: 'Para quem está começando do zero ou quer mudar de carreira. Não importa se você nunca escreveu uma linha de código; aqui o aprendizado acontece passo a passo, do jeito mais simples e motivador.',
            expanded: false
        },
        {
            question: 'O que já está disponível no plano atual?',
            answer: 'Você tem acesso completo a todos os módulos básicos, organizados em submódulos, lições, quizzes e desafios práticos.',
            expanded: false
        },
        {
            question: 'Como funcionam as lições e os quizzes?',
            answer: 'Cada lição traz vídeo e/ou texto, materiais extras e, ao final, um quiz de 10 questões. Acertando pelo menos 7 você avança para a próxima etapa.',
            expanded: false
        },
        {
            question: 'O que são as lições de desafio e de revisão?',
            answer: 'Desafio: escreva código e receba avaliação automática de uma IA, que aponta o que está ótimo e o que pode melhorar. Revisão: 10 perguntas aleatórias das lições que você já completou, para reforçar o conhecimento e evitar o esquecimento.',
            expanded: false
        },
        {
            question: 'Existe limite para o uso da avaliação por IA?',
            answer: 'Sim! Para envio de código nos desafios, usuários do plano gratuito têm até 5 avaliações por dia, enquanto assinantes Pró contam com até 30 avaliações diárias.',
            expanded: false
        },
        {
            question: 'O que é XP e como eu uso?',
            answer: 'XP é a pontuação que você ganha ao concluir lições. Ela serve para subir no ranking (geral, mensal e semanal) e para acompanhar a sua evolução.',
            expanded: false
        },
        {
            question: 'O que são seeds e como eu uso?',
            answer: 'Seeds é a moeda oficial da plataforma e serve para você comprar dicas das perguntas que você estiver com dificuldades. Futuramente, iremos adicionar mais possibilidades para uso desta moeda.',
            expanded: false
        },
        {
            question: 'Preciso pagar para começar?',
            answer: 'Não! Cadastre-se gratuitamente para ter acesso a todos os módulos, submódulos e lições da plataforma, limitado à conclusão de até 5 lições por dia. O plano gratuito exibe anúncios discretos nas páginas. Quando quiser estudar sem limite diário e sem qualquer anúncio, basta assinar o plano Pró.',
            expanded: false
        },
        {
            question: 'Quanto custa a assinatura e o que inclui?',
            answer: 'R$ 29,90 / mês – remove o limite diário de lições, oferece uma experiência 100% livre de anúncios, avaliações diárias ilimitadas de IA para desafios e suporte prioritário. O cancelamento pode ser feito a qualquer momento.',
            expanded: false
        },
        {
            question: 'Como funcionam os cupons de desconto?',
            answer: 'Em campanhas nas redes sociais, nas parcerias com faculdades ou em eventos especiais, divulgamos códigos promocionais. Na tela de assinatura, basta inserir o cupom e o desconto é aplicado automaticamente.',
            expanded: false
        },
    ]);

    protected selectMethodology(type: 'teoria' | 'revisao' | 'desafio') {
        this.activeMethodology.set(type);
    }

    protected toggleFaq(index: number) {
        this.faqItems.update(items => {
            const newItems = [...items];
            newItems[index].expanded = !newItems[index].expanded;
            return newItems;
        });
    }

    async ngOnInit() {
        try {
            const modulesData = await this.moduleService.getModules();
            this.modules.set(modulesData.sort((a, b) => (a.inRevision ? 1 : 0) - (b.inRevision ? 1 : 0)));
        } catch (error) {
            console.error('Error fetching modules', error);
        }
    }
}
