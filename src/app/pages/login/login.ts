import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';

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

    constructor(
        private fb: FormBuilder,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }
    get f(): { email: AbstractControl; password: AbstractControl } {
        return this.loginForm.controls as { email: AbstractControl; password: AbstractControl };
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
            if (this.loginForm.value.email === 'joissonjdm@gmail.com' && this.loginForm.value.password === '123456') {
                // redirecionar ou workflow real de autenticação
                this.authError = '';
                this.router.navigate(['/app']);
            } else {
                this.authError = 'Email ou senha incorretos. Tente novamente.';
            }
        }, 800);
    }
}
