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

        if (this.loginForm.invalid) {
            return;
        }

        this.busy = true;

        try {
            await this.userService.signIn(this.loginForm.value);
            this.router.navigate(['/app']);
        } catch (error: any) {
            this.authError = error.message || 'Email ou senha incorretos. Tente novamente.';
        } finally {
            this.busy = false;
        }
    }
}
