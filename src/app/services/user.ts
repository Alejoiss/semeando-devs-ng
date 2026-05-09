import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { User } from '../../models/user/user';
import { Profile } from '../../models/profile/profile';
import { mapAuthError } from '../utils/auth-error-mapper';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private supabase: SupabaseClient;
    private userSignal = signal<User | null>(null);

    readonly currentUser = computed(() => this.userSignal());

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
        this.loadUserProfile();
    }

    public async loadUserProfile() {
        try {
            const user = await this.getUserProfile();
            this.userSignal.set(user);
        } catch (error) {
            this.userSignal.set(null);
        }
    }

    async signIn(user: Partial<User>): Promise<void> {
        if (!user.email || !user.password) {
            throw new Error('Email and password are required');
        }

        const { error } = await this.supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password,
        });

        if (error) {
            const mappedMessage = mapAuthError(error.message);
            const err: any = new Error(mappedMessage);
            if (error.message.includes('Email not confirmed')) {
                err.code = 'email_not_confirmed';
            }
            throw err;
        }

        await this.loadUserProfile();
    }

    async signOut(): Promise<void> {
        await this.supabase.auth.signOut();
        this.userSignal.set(null);
    }

    async getSession() {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) {
            return null;
        }
        return session;
    }

    async register(user: Partial<User>): Promise<void> {
        if (!user.email || !user.password) {
            throw new Error('Email and password are required');
        }

        const { error } = await this.supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                emailRedirectTo: 'http://localhost:4201/auth/login',
                data: {
                    name: user.name,
                }
            }
        });

        if (error) {
            throw new Error(mapAuthError(error.message));
        }
    }

    async getUserProfile(): Promise<User> {
        const { data: { user }, error } = await this.supabase.auth.getUser();

        if (error || !user) {
            throw new Error(error?.message || 'User not authenticated');
        }

        const { data: profileData } = await this.supabase
            .from('profiles')
            .select('is_pro, pro_until')
            .eq('id', user.id)
            .returns<Profile[]>()
            .single();

        const profile: User = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.['name'] || '',
            password: '',
            acceptedTerms: true,
            acceptedTermsAt: new Date(user.created_at),
            avatar: user.user_metadata?.['avatar'] || '',
            plan: user.user_metadata?.['plan'] || null,
            isPro: profileData?.is_pro || false,
            proUntil: profileData?.pro_until ? new Date(profileData.pro_until) : null,
        };

        return profile;
    }

    async updateUserProfile(updates: Partial<User>): Promise<void> {
        const { email, password, ...metadataUpdates } = updates;

        const { error } = await this.supabase.auth.updateUser({
            ...(email && { email }),
            ...(password && { password }),
            data: metadataUpdates,
        });

        if (error) {
            throw new Error(mapAuthError(error.message));
        }

        await this.loadUserProfile();
    }
    async uploadAvatar(file: File): Promise<string> {
        const user = this.userSignal();
        if (!user) throw new Error('User not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await this.supabase.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        const { data: { publicUrl } } = this.supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        await this.updateUserProfile({ avatar: publicUrl });

        return publicUrl;
    }

    async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
        const user = this.userSignal();
        if (!user || !user.email) throw new Error('Usuário não autenticado ou sem e-mail.');

        const { error: signInError } = await this.supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        });

        if (signInError) {
            throw new Error('A senha atual está incorreta.');
        }

        const { error: updateError } = await this.supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            throw new Error(mapAuthError(updateError.message));
        }
    }

    async resendConfirmationEmail(email: string): Promise<void> {
        const { error } = await this.supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) {
            throw new Error(mapAuthError(error.message));
        }
    }

    async sendPasswordResetEmail(email: string): Promise<void> {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:4201/redefinir-senha',
        });

        if (error) {
            throw new Error(mapAuthError(error.message));
        }
    }
}
