import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPassword {
  public resetForm: FormGroup;
  public busy = false;
  public submitted = false;
  public errorMessage = '';
  public successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get f(): { [key: string]: AbstractControl } {
    return this.resetForm.controls;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetForm.invalid) {
      return;
    }

    this.busy = true;

    try {
      await this.userService.updateUserProfile({ password: this.resetForm.value.password });
      this.successMessage = 'Senha atualizada com sucesso! Redirecionando...';
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
    } catch (error: any) {
      this.errorMessage = error.message || 'Falha ao redefinir a senha. Tente novamente.';
    } finally {
      this.busy = false;
    }
  }
}
