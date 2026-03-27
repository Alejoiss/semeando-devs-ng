import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer],
    templateUrl: './login.html',
    styleUrls: ['./login.scss']
})
export class Login implements OnInit {
    public loginForm: FormGroup;
    public busy = false;
    public submitted = false;
    public authError = '';
    public loginTitle = 'Bem-vindo de volta, Dev!';

    constructor(private fb: FormBuilder) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    ngOnInit(): void {
        this.loadMcpStitchInfo();
    }

    get f(): { email: AbstractControl; password: AbstractControl } {
        return this.loginForm.controls as { email: AbstractControl; password: AbstractControl };
    }

    loadMcpStitchInfo(): void {
        // Simulação do passo "mcp do Stitch" para obter texto/ajustes do login
        // Em integração real, esse método fará fetch para um endpoint de configurações.
        const stitchData = {
            title: 'Bem-vindo de volta, Dev!',
            subtitle: 'Continue sua jornada rumo ao próximo nível.'
        };
        this.loginTitle = stitchData.title;
    }

    onSubmit(): void {
        this.submitted = true;
        this.authError = '';

        if (this.loginForm.invalid) {
            return;
        }

        this.busy = true;

        setTimeout(() => {
            this.busy = false;
            if (this.loginForm.value.email === 'teste@semeando.dev' && this.loginForm.value.password === '123456') {
                // redirecionar ou workflow real de autenticação
                this.authError = '';
            } else {
                this.authError = 'Email ou senha incorretos. Tente novamente.';
            }
        }, 800);
    }
}
