import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { User } from '../../models/user/user';

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
            throw new Error(error.message);
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
                data: {
                    name: user.name,
                }
            }
        });

        if (error) {
            throw new Error(error.message);
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
            throw new Error(error.message);
        }
    }
}
