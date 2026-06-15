import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { Footer } from '../../components/footer/footer';
import { UserService } from '../../services/user';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl) => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { mismatch: true } : null;
};

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer],
    templateUrl: './register.html',
    styleUrls: ['./register.scss']
})
export class Register {
    public registerForm: FormGroup;
    public submitted = false;
    public busy = false;
    public registerError = '';
    public registerTitle = 'Comece sua jornada hoje';

    constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            termsAccepted: [false, [Validators.requiredTrue]],
            newsletterActive: [false]
        }, { validators: passwordMatchValidator });
    }

    get f(): { name: AbstractControl; email: AbstractControl; password: AbstractControl; confirmPassword: AbstractControl; termsAccepted: AbstractControl; newsletterActive: AbstractControl } {
        return this.registerForm.controls as { name: AbstractControl; email: AbstractControl; password: AbstractControl; confirmPassword: AbstractControl; termsAccepted: AbstractControl; newsletterActive: AbstractControl };
    }

    async onSubmit(): Promise<void> {
        this.submitted = true;
        this.registerError = '';

        if (this.registerForm.invalid) {
            return;
        }

        this.busy = true;
        try {
            const { name, email, password, newsletterActive } = this.registerForm.value;
            await this.userService.register({ 
                name, 
                email, 
                password, 
                newsletter_active: newsletterActive,
                acceptedTerms: true,
                acceptedTermsAt: new Date()
            });
            this.router.navigate(['/auth/login']);
        } catch (error: any) {
            this.registerError = error.message || 'Erro ao criar conta. Tente novamente.';
        } finally {
            this.busy = false;
        }
    }
}
