import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAiSettings } from './ai-settings';
import { AdminAiSettingsService } from '../../../../services/admin-ai-settings';
import { AiModelResult, AiSettings } from '../../../../../models/ai-settings/ai-settings';

describe('AdminAiSettings', () => {
    let fixture: ComponentFixture<AdminAiSettings>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let component: any;
    let service: jasmine.SpyObj<AdminAiSettingsService>;

    const settings = (): AiSettings => ({
        models: { evaluate_challenge: ['openai/gpt-5-nano'], evaluate_lesson_content: ['a/one', 'b/two'] },
        emails: ['ops@x.com'],
    });
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const button = (label: string) =>
        (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(b => b.getAttribute('aria-label') === label || b.textContent?.trim() === label) as HTMLButtonElement | undefined;

    async function setup(load: AiSettings | Error = settings()) {
        if (load instanceof Error) {
            service.getSettings.and.rejectWith(load);
        } else {
            service.getSettings.and.resolveTo(load);
        }
        fixture = TestBed.createComponent(AdminAiSettings);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function addModel(feature: string, value: string) {
        component.modelControls[feature].setValue(value);
        component.addModel(feature);
        fixture.detectChanges();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj('AdminAiSettingsService', ['getSettings', 'saveSettings', 'checkModels', 'testModel']);
        service.saveSettings.and.resolveTo();
        TestBed.configureTestingModule({ providers: [{ provide: AdminAiSettingsService, useValue: service }] });
    });

    describe('loading', () => {
        it('shows the saved models and e-mails', async () => {
            await setup();
            expect(text()).toContain('openai/gpt-5-nano');
            expect(text()).toContain('a/one');
            expect(text()).toContain('ops@x.com');
        });

        it('shows the error and blocks saving when loading fails', async () => {
            await setup(new Error('denied'));
            expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('denied');
            expect(component.canSave()).toBeFalse();
        });
    });

    describe('models', () => {
        beforeEach(() => setup());

        it('marks the first model as primary and the rest as fallbacks', () => {
            expect(text()).toContain('Principal');
            expect(text()).toContain('Fallback 1');
        });

        it('warns when a feature has no fallback', () => {
            expect(text()).toContain('Sem fallback');
        });

        it('appends a valid model to the end of the list and clears the input', () => {
            addModel('evaluate_challenge', ' google/gemini-2.5-flash-lite ');
            expect(component.models().evaluate_challenge).toEqual(['openai/gpt-5-nano', 'google/gemini-2.5-flash-lite']);
            expect(component.modelControls.evaluate_challenge.value).toBe('');
        });

        it('accepts variant suffixes such as :free', () => {
            addModel('evaluate_challenge', 'meta-llama/llama-3.3-70b-instruct:free');
            expect(component.models().evaluate_challenge.length).toBe(2);
        });

        it('rejects ids that are not provider/model', () => {
            addModel('evaluate_challenge', 'gpt-5');
            expect(component.models().evaluate_challenge).toEqual(['openai/gpt-5-nano']);
            expect(text()).toContain('provedor/modelo');
        });

        it('rejects a duplicate, ignoring case', () => {
            addModel('evaluate_challenge', 'OpenAI/GPT-5-Nano');
            expect(component.models().evaluate_challenge.length).toBe(1);
            expect(text()).toContain('já está na lista');
        });

        it('rejects more than five models', () => {
            for (const id of ['a/1', 'a/2', 'a/3', 'a/4']) addModel('evaluate_challenge', id);
            expect(component.models().evaluate_challenge.length).toBe(5);
            addModel('evaluate_challenge', 'a/6');
            expect(component.models().evaluate_challenge.length).toBe(5);
            expect(text()).toContain('no máximo 5');
        });

        it('reorders models and ignores moves past the ends', () => {
            component.moveModel('evaluate_lesson_content', 0, 1);
            expect(component.models().evaluate_lesson_content).toEqual(['b/two', 'a/one']);
            component.moveModel('evaluate_lesson_content', 0, -1);
            expect(component.models().evaluate_lesson_content).toEqual(['b/two', 'a/one']);
        });

        it('disables the move buttons at the ends of the list', () => {
            expect(button('Mover a/one para cima')!.disabled).toBeTrue();
            expect(button('Mover b/two para baixo')!.disabled).toBeTrue();
            expect(button('Mover a/one para baixo')!.disabled).toBeFalse();
        });

        it('removes a model and blocks saving while a feature is left empty', () => {
            button('Remover openai/gpt-5-nano')!.click();
            fixture.detectChanges();
            expect(component.models().evaluate_challenge).toEqual([]);
            expect(component.canSave()).toBeFalse();
            expect(text()).toContain('Mantenha ao menos um modelo');
        });
    });

    describe('alert e-mails', () => {
        beforeEach(() => setup());

        function addEmail(value: string) {
            component.emailControl.setValue(value);
            component.addEmail();
            fixture.detectChanges();
        }

        it('adds a normalized e-mail', () => {
            addEmail('  Dev@X.com ');
            expect(component.emails()).toEqual(['ops@x.com', 'dev@x.com']);
        });

        it('rejects an invalid e-mail and a duplicate', () => {
            addEmail('not-an-email');
            expect(text()).toContain('e-mail válido');
            addEmail('OPS@x.com');
            expect(text()).toContain('já está na lista');
            expect(component.emails()).toEqual(['ops@x.com']);
        });

        it('removes an e-mail', () => {
            button('Remover ops@x.com')!.click();
            fixture.detectChanges();
            expect(component.emails()).toEqual([]);
        });
    });

    describe('saving', () => {
        beforeEach(() => setup());

        it('saves the current lists and confirms', async () => {
            addModel('evaluate_challenge', 'a/fallback');

            await component.save();
            fixture.detectChanges();

            expect(service.saveSettings).toHaveBeenCalledWith({
                models: { evaluate_challenge: ['openai/gpt-5-nano', 'a/fallback'], evaluate_lesson_content: ['a/one', 'b/two'] },
                emails: ['ops@x.com'],
            });
            expect(text()).toContain('Configurações salvas');
        });

        it('shows the error when saving fails', async () => {
            service.saveSettings.and.rejectWith(new Error('check violated'));

            await component.save();
            fixture.detectChanges();

            expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('check violated');
            expect(component.isSaving()).toBeFalse();
        });
    });

    describe('model check', () => {
        beforeEach(() => setup());

        it('labels each model with its status, including the removal date', async () => {
            service.checkModels.and.resolveTo({
                catalogAvailable: true,
                checks: [
                    { feature: 'evaluate_challenge', model: 'openai/gpt-5-nano', status: 'expiring', expiresAt: '2026-12-31', detail: null },
                    { feature: 'evaluate_lesson_content', model: 'a/one', status: 'removed', expiresAt: null, detail: 'gone' },
                    { feature: 'evaluate_lesson_content', model: 'b/two', status: 'ok', expiresAt: null, detail: null },
                ],
            });

            await component.runCheck();
            fixture.detectChanges();

            expect(text()).toContain('Retirada agendada: 31/12/2026');
            expect(text()).toContain('Removido do OpenRouter');
            expect(text()).toContain('Funcionando');
        });

        it('tests a single model from its row and shows the result with the failure detail', async () => {
            service.testModel.and.resolveTo({ model: 'a/one', status: 'failing', expiresAt: null, detail: 'HTTP 500: provider error' });

            button('Testar a/one')!.click();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(service.testModel).toHaveBeenCalledOnceWith('a/one');
            expect(text()).toContain('Falhando');
            expect(text()).toContain('HTTP 500: provider error');
            expect(component.testing().has('a/one')).toBeFalse();
        });

        it('disables the row button while its test runs and ignores a second click', async () => {
            let finish!: (r: AiModelResult) => void;
            service.testModel.and.returnValue(new Promise(resolve => (finish = resolve)));

            const first = component.testModel('a/one');
            component.testModel('a/one');
            fixture.detectChanges();

            expect(service.testModel).toHaveBeenCalledTimes(1);
            expect(button('Testar a/one')!.disabled).toBeTrue();
            expect(text()).toContain('Testando...');

            finish({ model: 'a/one', status: 'ok', expiresAt: null, detail: null });
            await first;
            fixture.detectChanges();
            expect(button('Testar a/one')!.disabled).toBeFalse();
        });

        it('shows a failure when the test request itself fails', async () => {
            service.testModel.and.rejectWith(new Error('Forbidden'));
            await component.testModel('a/one');
            fixture.detectChanges();
            expect(text()).toContain('Forbidden');
        });

        it('tests a model that was just added and not saved yet', async () => {
            service.testModel.and.resolveTo({ model: 'new/model', status: 'ok', expiresAt: null, detail: null });
            addModel('evaluate_challenge', 'new/model');

            button('Testar new/model')!.click();
            await fixture.whenStable();
            fixture.detectChanges();

            expect(service.testModel).toHaveBeenCalledOnceWith('new/model');
        });

        it('warns when the catalog was unavailable', async () => {
            service.checkModels.and.resolveTo({ checks: [], catalogAvailable: false });
            await component.runCheck();
            fixture.detectChanges();
            expect(text()).toContain('catálogo do OpenRouter não respondeu');
        });

        it('shows the error when the check fails', async () => {
            service.checkModels.and.rejectWith(new Error('Forbidden'));
            await component.runCheck();
            fixture.detectChanges();
            expect(text()).toContain('Forbidden');
            expect(component.isChecking()).toBeFalse();
        });
    });
});
