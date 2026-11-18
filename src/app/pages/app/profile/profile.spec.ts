import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { UserService } from '../../../services/user';

describe('Profile page', () => {
    let fixture: ComponentFixture<Profile>;
    let component: any;
    let userService: {
        currentUser: ReturnType<typeof signal<any>>;
        updateUserProfile: jasmine.Spy;
        updatePassword: jasmine.Spy;
        uploadAvatar: jasmine.Spy;
    };

    const text = () => fixture.nativeElement.textContent as string;

    beforeEach(() => {
        userService = {
            currentUser: signal({ id: 'u1', name: 'Maria Silva', email: 'maria@x.dev', avatar: '', newsletter_active: true }),
            updateUserProfile: jasmine.createSpy('updateUserProfile').and.resolveTo(),
            updatePassword: jasmine.createSpy('updatePassword').and.resolveTo(),
            uploadAvatar: jasmine.createSpy('uploadAvatar').and.resolveTo('url'),
        };
        TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: userService }] });
        fixture = TestBed.createComponent(Profile);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('fills the profile form with the current user', () => {
        expect(component.profileForm.value).toEqual({ name: 'Maria Silva', newsletter_active: true });
    });

    it('shows the e-mail of the user', () => {
        const emailInput = fixture.nativeElement.querySelector('input[type="email"], input[readonly]') as HTMLInputElement;
        expect(emailInput?.value ?? text()).toContain('maria@x.dev');
    });

    describe('profile form', () => {
        it('requires a name with at least 3 characters', () => {
            component.profileForm.patchValue({ name: '' });
            expect(component.profileForm.invalid).toBeTrue();
            component.profileForm.patchValue({ name: 'Al' });
            expect(component.profileForm.invalid).toBeTrue();
            component.profileForm.patchValue({ name: 'Ana' });
            expect(component.profileForm.valid).toBeTrue();
        });

        it('saves and shows a success message', async () => {
            component.profileForm.patchValue({ name: 'Maria Souza', newsletter_active: false });

            await component.updateProfile();
            fixture.detectChanges();

            expect(userService.updateUserProfile).toHaveBeenCalledWith({ name: 'Maria Souza', newsletter_active: false });
            expect(text()).toContain('Perfil atualizado com sucesso!');
            expect(component.isUpdatingProfile()).toBeFalse();
        });

        it('shows the error message when saving fails', async () => {
            userService.updateUserProfile.and.rejectWith(new Error('Nome já usado'));

            await component.updateProfile();
            fixture.detectChanges();

            expect(text()).toContain('Nome já usado');
            expect(component.isUpdatingProfile()).toBeFalse();
        });

        it('falls back to a default error message', async () => {
            userService.updateUserProfile.and.rejectWith({});
            await component.updateProfile();
            expect(component.profileMessage()).toEqual({ type: 'error', text: 'Falha ao atualizar perfil.' });
        });

        it('does not save an invalid form', async () => {
            component.profileForm.patchValue({ name: '' });
            await component.updateProfile();
            expect(userService.updateUserProfile).not.toHaveBeenCalled();
        });

        it('ignores a second submit while saving', async () => {
            component.isUpdatingProfile.set(true);
            await component.updateProfile();
            expect(userService.updateUserProfile).not.toHaveBeenCalled();
        });

        it('disables the save button while the form is invalid', () => {
            component.profileForm.patchValue({ name: '' });
            fixture.detectChanges();
            const save = fixture.nativeElement.querySelector('form button[type="submit"]') as HTMLButtonElement;
            expect(save.disabled).toBeTrue();
        });
    });

    describe('password form', () => {
        const fill = (over: object = {}) =>
            component.passwordForm.setValue({ currentPassword: 'old-pass', newPassword: 'new-pass', confirmPassword: 'new-pass', ...over });

        it('starts invalid', () => {
            expect(component.passwordForm.invalid).toBeTrue();
        });

        it('requires the new password to have at least 6 characters', () => {
            fill({ newPassword: '12345', confirmPassword: '12345' });
            expect(component.passwordForm.get('newPassword').errors?.['minlength']).toBeTruthy();
        });

        it('flags a confirmation that does not match', () => {
            fill({ confirmPassword: 'different' });
            expect(component.passwordForm.errors).toEqual({ mismatch: true });
            expect(component.passwordForm.invalid).toBeTrue();
        });

        it('is valid with matching passwords', () => {
            fill();
            expect(component.passwordForm.valid).toBeTrue();
        });

        it('changes the password, clears the form and shows a success message', async () => {
            fill();

            await component.updatePassword();
            fixture.detectChanges();

            expect(userService.updatePassword).toHaveBeenCalledWith('old-pass', 'new-pass');
            expect(component.passwordForm.value.newPassword).toBeNull();
            expect(text()).toContain('Senha atualizada com sucesso!');
        });

        it('shows the error and keeps the typed values when it fails', async () => {
            fill();
            userService.updatePassword.and.rejectWith(new Error('Senha atual incorreta'));

            await component.updatePassword();
            fixture.detectChanges();

            expect(text()).toContain('Senha atual incorreta');
            expect(component.passwordForm.value.newPassword).toBe('new-pass');
            expect(component.isUpdatingPassword()).toBeFalse();
        });

        it('falls back to a default error message', async () => {
            fill();
            userService.updatePassword.and.rejectWith({});
            await component.updatePassword();
            expect(component.passwordMessage()).toEqual({ type: 'error', text: 'Falha ao atualizar senha.' });
        });

        it('does nothing when the form is invalid', async () => {
            fill({ confirmPassword: 'other' });
            await component.updatePassword();
            expect(userService.updatePassword).not.toHaveBeenCalled();
        });
    });

    describe('avatar upload', () => {
        const fileEvent = (file?: File) => ({ target: { files: file ? [file] : [] } });

        it('uploads the chosen file and shows a success message', async () => {
            const file = new File(['x'], 'me.png', { type: 'image/png' });

            await component.onFileSelected(fileEvent(file));

            expect(userService.uploadAvatar).toHaveBeenCalledWith(file);
            expect(component.profileMessage()).toEqual({ type: 'success', text: 'Avatar atualizado com sucesso!' });
            expect(component.isUploadingAvatar()).toBeFalse();
        });

        it('does nothing when no file was chosen', async () => {
            await component.onFileSelected(fileEvent());
            expect(userService.uploadAvatar).not.toHaveBeenCalled();
        });

        it('shows the upload error', async () => {
            userService.uploadAvatar.and.rejectWith(new Error('Arquivo muito grande'));

            await component.onFileSelected(fileEvent(new File(['x'], 'big.png')));

            expect(component.profileMessage()).toEqual({ type: 'error', text: 'Arquivo muito grande' });
        });

        it('falls back to a default upload error', async () => {
            userService.uploadAvatar.and.rejectWith({});
            await component.onFileSelected(fileEvent(new File(['x'], 'a.png')));
            expect(component.profileMessage()?.text).toBe('Falha ao fazer upload do avatar.');
        });

        it('ignores a new file while uploading', async () => {
            component.isUploadingAvatar.set(true);
            await component.onFileSelected(fileEvent(new File(['x'], 'a.png')));
            expect(userService.uploadAvatar).not.toHaveBeenCalled();
        });
    });
});
