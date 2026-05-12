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
            answer: 'É uma plataforma gamificada para aprendizado de desenvolvimento web, onde você aprende de forma prática e divertida.',
            expanded: false
        },
        {
            question: 'A plataforma é totalmente gratuita?',
            answer: 'Sim! Nosso objetivo é democratizar o acesso ao ensino de tecnologia de qualidade.',
            expanded: false
        },
        {
            question: 'Preciso ter conhecimento prévio?',
            answer: 'Não! Nossas trilhas começam do zero absoluto, ensinando desde a base até conceitos avançados.',
            expanded: false
        }
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
