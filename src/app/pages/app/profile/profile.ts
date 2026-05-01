import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
    private fb = inject(FormBuilder);
    private userService = inject(UserService);

    protected readonly currentUser = this.userService.currentUser;

    protected profileForm!: FormGroup;
    protected passwordForm!: FormGroup;

    protected isUpdatingProfile = signal(false);
    protected isUpdatingPassword = signal(false);
    protected isUploadingAvatar = signal(false);

    protected profileMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);
    protected passwordMessage = signal<{ type: 'success' | 'error', text: string } | null>(null);

    ngOnInit(): void {
        this.initForms();
    }

    private initForms() {
        const user = this.currentUser();
        this.profileForm = this.fb.group({
            name: [user?.name || '', [Validators.required, Validators.minLength(3)]],
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        }, { validators: this.passwordMatchValidator });
    }

    private passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmPassword')?.value
            ? null : { mismatch: true };
    }

    async updateProfile() {
        if (this.profileForm.invalid || this.isUpdatingProfile()) return;

        this.isUpdatingProfile.set(true);
        this.profileMessage.set(null);

        try {
            await this.userService.updateUserProfile(this.profileForm.value);
            this.profileMessage.set({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error: any) {
            this.profileMessage.set({ type: 'error', text: error.message || 'Falha ao atualizar perfil.' });
        } finally {
            this.isUpdatingProfile.set(false);
        }
    }

    async updatePassword() {
        if (this.passwordForm.invalid || this.isUpdatingPassword()) return;

        this.isUpdatingPassword.set(true);
        this.passwordMessage.set(null);

        try {
            await this.userService.updatePassword(
                this.passwordForm.value.currentPassword,
                this.passwordForm.value.newPassword
            );
            this.passwordForm.reset();
            this.passwordMessage.set({ type: 'success', text: 'Senha atualizada com sucesso!' });
        } catch (error: any) {
            this.passwordMessage.set({ type: 'error', text: error.message || 'Falha ao atualizar senha.' });
        } finally {
            this.isUpdatingPassword.set(false);
        }
    }

    async onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (!file || this.isUploadingAvatar()) return;

        this.isUploadingAvatar.set(true);
        try {
            await this.userService.uploadAvatar(file);
            this.profileMessage.set({ type: 'success', text: 'Avatar atualizado com sucesso!' });
        } catch (error: any) {
            this.profileMessage.set({ type: 'error', text: error.message || 'Falha ao fazer upload do avatar.' });
        } finally {
            this.isUploadingAvatar.set(false);
        }
    }
}
