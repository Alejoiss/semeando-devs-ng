import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    public readonly client: SupabaseClient;

    constructor() {
        // Na pré-renderização não há sessão de usuário, e o auto refresh manteria timers que impedem a app de estabilizar
        const isServer = isPlatformServer(inject(PLATFORM_ID));
        this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: { persistSession: !isServer, autoRefreshToken: !isServer, detectSessionInUrl: !isServer },
        });
    }
}
