import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '../app/services/supabase';
import { FakeSupabaseService } from './fake-supabase';

// Impede que qualquer spec crie o client real do Supabase (o lock de auth derruba o runner do Karma).
// Specs que fornecem o próprio SupabaseService sobrescrevem este padrão.
beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [{ provide: SupabaseService, useClass: FakeSupabaseService }],
    });
});
