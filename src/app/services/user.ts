import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { User } from '../../models/user/user';
import { mapAuthError } from '../utils/auth-error-mapper';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
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

        return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.['name'] || '',
            password: '',
            acceptedTerms: true,
            acceptedTermsAt: new Date(user.created_at),
            avatar: user.user_metadata?.['avatar'] || '',
            plan: user.user_metadata?.['plan'] || null,
        } as User;
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
