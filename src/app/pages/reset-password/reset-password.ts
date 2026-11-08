import { CommonModule } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { PasswordToggle } from '../../components/password-toggle/password-toggle';
import { Footer } from '../../components/footer/footer';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Footer, PasswordToggle],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPassword {
  public resetForm: FormGroup;
  public busy = false;
  public submitted = false;
  public errorMessage = '';
  public successMessage = '';
  public linkInvalid = false;
  private readonly tokenHash: string | null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    route: ActivatedRoute
  ) {
    this.tokenHash = route.snapshot.queryParamMap.get('token_hash');
    if (isPlatformBrowser(inject(PLATFORM_ID)) && window.location.hash.includes('error=')) {
      this.linkInvalid = true;
    }

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
      const { password } = this.resetForm.value;
      if (this.tokenHash) {
        await this.userService.resetPasswordWithToken(this.tokenHash, password);
      } else {
        await this.userService.updateUserProfile({ password });
      }
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
