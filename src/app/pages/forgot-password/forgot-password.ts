import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Footer } from '../../components/footer/footer';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPassword {
  public recoveryForm: FormGroup;
  public busy = false;
  public submitted = false;
  public successMessage = '';
  public errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get f(): { email: AbstractControl } {
    return this.recoveryForm.controls as { email: AbstractControl };
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.recoveryForm.invalid) {
      return;
    }

    this.busy = true;

    try {
      await this.userService.sendPasswordResetEmail(this.recoveryForm.value.email);
      this.successMessage = 'Se o e-mail existir em nossa base, um link de recuperação foi enviado.';
    } catch (error: any) {
      this.errorMessage = error.message || 'Falha ao solicitar a recuperação. Tente novamente.';
    } finally {
      this.busy = false;
    }
  }
}
