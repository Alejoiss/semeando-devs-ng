import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';
import { UserService } from '../../services/user';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer],
    templateUrl: './login.html',
    styleUrls: ['./login.scss']
})
export class Login {
    public loginForm: FormGroup;
    public busy = false;
    public submitted = false;
    public authError = '';
    public loginTitle = 'Bem-vindo de volta, Dev!';
    
    public isEmailUnverified = false;
    public resendBusy = false;
    public resendSuccess = false;
    public resendError = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private userService: UserService
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }
    get f(): { email: AbstractControl; password: AbstractControl } {
        return this.loginForm.controls as { email: AbstractControl; password: AbstractControl };
    }

    async onSubmit(): Promise<void> {
        this.submitted = true;
        this.authError = '';
        this.isEmailUnverified = false;
        this.resendSuccess = false;
        this.resendError = '';

        if (this.loginForm.invalid) {
            return;
        }

        this.busy = true;

        try {
            await this.userService.signIn(this.loginForm.value);
            this.router.navigate(['/app']);
        } catch (error: any) {
            if (error.code === 'email_not_confirmed') {
                this.isEmailUnverified = true;
                this.authError = 'Sua conta ainda não foi verificada. Verifique seu e-mail para confirmar seu acesso.';
            } else {
                this.authError = error.message || 'Email ou senha incorretos. Tente novamente.';
            }
        } finally {
            this.busy = false;
        }
    }

    async resendEmail(): Promise<void> {
        if (!this.loginForm.value.email) return;

        this.resendBusy = true;
        this.resendError = '';
        this.resendSuccess = false;

        try {
            await this.userService.resendConfirmationEmail(this.loginForm.value.email);
            this.resendSuccess = true;
        } catch (error: any) {
            this.resendError = error.message || 'Falha ao reenviar o e-mail. Tente novamente.';
        } finally {
            this.resendBusy = false;
        }
    }
}
