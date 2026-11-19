import { TestBed } from '@angular/core/testing';
import { AdminAiSettingsService } from './admin-ai-settings';
import { SupabaseService } from './supabase';
import { createQueryStub, StubResult } from '../../testing/query-stub';

describe('AdminAiSettingsService', () => {
    let service: AdminAiSettingsService;
    let fromSpy: jasmine.Spy;
    let invoke: jasmine.Spy;

    function respondWith(results: Record<string, StubResult>) {
        const stubs = new Map<string, ReturnType<typeof createQueryStub>>();
        fromSpy.and.callFake((table: string) => {
            const stub = createQueryStub(results[table] ?? {});
            stubs.set(table, stub);
            return stub.query;
        });
        return stubs;
    }

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        invoke = jasmine.createSpy('invoke');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy, functions: { invoke } } } }],
        });
        service = TestBed.inject(AdminAiSettingsService);
    });

    describe('getSettings', () => {
        it('maps the rows to one list per feature and reads the alert e-mails', async () => {
            respondWith({
                ai_model_settings: { data: [{ feature: 'evaluate_challenge', models: ['a/one', 'b/two'] }] },
                ai_alert_settings: { data: { emails: ['ops@x.com'] } },
            });

            expect(await service.getSettings()).toEqual({
                models: { evaluate_challenge: ['a/one', 'b/two'], evaluate_lesson_content: [] },
                emails: ['ops@x.com'],
            });
        });

        it('tolerates a missing alert row and ignores unknown features', async () => {
            respondWith({
                ai_model_settings: { data: [{ feature: 'something_else', models: ['x/y'] }] },
                ai_alert_settings: { data: null },
            });

            expect(await service.getSettings()).toEqual({
                models: { evaluate_challenge: [], evaluate_lesson_content: [] },
                emails: [],
            });
        });

        it('throws the database message when a query fails', async () => {
            respondWith({ ai_model_settings: { error: { message: 'denied' } } });
            await expectAsync(service.getSettings()).toBeRejectedWithError('denied');

            respondWith({ ai_alert_settings: { error: { message: 'alert denied' } } });
            await expectAsync(service.getSettings()).toBeRejectedWithError('alert denied');
        });
    });

    describe('saveSettings', () => {
        const settings = {
            models: { evaluate_challenge: ['a/one'], evaluate_lesson_content: ['b/two', 'c/three'] },
            emails: ['ops@x.com'],
        };

        it('upserts one row per feature and the single alert row', async () => {
            const stubs = respondWith({});

            await service.saveSettings(settings);

            const models = stubs.get('ai_model_settings')!.spy('upsert').calls.mostRecent();
            expect(models.args[0].map((r: { feature: string; models: string[] }) => [r.feature, r.models])).toEqual([
                ['evaluate_challenge', ['a/one']],
                ['evaluate_lesson_content', ['b/two', 'c/three']],
            ]);
            expect(models.args[1]).toEqual({ onConflict: 'feature' });

            const alerts = stubs.get('ai_alert_settings')!.spy('upsert').calls.mostRecent();
            expect(alerts.args[0].id).toBeTrue();
            expect(alerts.args[0].emails).toEqual(['ops@x.com']);
        });

        it('stops and throws when the models cannot be saved', async () => {
            const stubs = respondWith({ ai_model_settings: { error: { message: 'check violated' } } });

            await expectAsync(service.saveSettings(settings)).toBeRejectedWithError('check violated');
            expect(stubs.has('ai_alert_settings')).toBeFalse();
        });

        it('throws when the alert e-mails cannot be saved', async () => {
            respondWith({ ai_alert_settings: { error: { message: 'alert denied' } } });
            await expectAsync(service.saveSettings(settings)).toBeRejectedWithError('alert denied');
        });
    });

    describe('checkModels', () => {
        it('runs the health check without sending the alert email', async () => {
            const result = { checks: [], catalogAvailable: true };
            invoke.and.resolveTo({ data: result, error: null });

            expect(await service.checkModels()).toEqual(result);
            expect(invoke).toHaveBeenCalledWith('check-ai-models', { body: { notify: false } });
        });

        it('surfaces the function error message', async () => {
            invoke.and.resolveTo({
                data: null,
                error: { message: 'non-2xx', context: { json: () => Promise.resolve({ error: 'Forbidden' }) } },
            });
            await expectAsync(service.checkModels()).toBeRejectedWithError('Forbidden');
        });

        it('keeps the generic message when the error has no JSON body', async () => {
            invoke.and.resolveTo({ data: null, error: { message: 'non-2xx', context: { json: () => Promise.reject(new Error('no body')) } } });
            await expectAsync(service.checkModels()).toBeRejectedWithError('non-2xx');
        });
    });
});
