import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';

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

    constructor(private fb: FormBuilder) {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: passwordMatchValidator });
    }

    get f(): { name: AbstractControl; email: AbstractControl; password: AbstractControl; confirmPassword: AbstractControl } {
        return this.registerForm.controls as { name: AbstractControl; email: AbstractControl; password: AbstractControl; confirmPassword: AbstractControl };
    }

    onSubmit(): void {
        this.submitted = true;
        this.registerError = '';

        if (this.registerForm.invalid) {
            return;
        }

        this.busy = true;
        setTimeout(() => {
            this.busy = false;
            if (this.registerForm.value.email === 'teste@semeando.dev') {
                this.registerError = 'O e-mail já está em uso. Use outro e-mail.';
            } else {
                this.registerError = '';
            }
        }, 800);
    }
}
