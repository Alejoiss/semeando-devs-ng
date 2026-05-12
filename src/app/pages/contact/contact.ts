import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, RouterModule, Header, Footer],
    templateUrl: './contact.html',
    styleUrls: ['./contact.scss'],
})
export class Contact {
    supportEmail = 'contato@semeandodevs.com.br';
    copied = false;

    async copyEmail(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.supportEmail);
            this.copied = true;
            setTimeout(() => (this.copied = false), 1800);
        } catch (err) {
            console.error('Erro ao copiar e-mail:', err);
        }
    }
}
