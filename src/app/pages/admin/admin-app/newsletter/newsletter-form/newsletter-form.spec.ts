import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AdminNewsletterForm } from './newsletter-form';
import { AdminNewsletterService } from '../../../../../services/admin-newsletter';

describe('AdminNewsletterForm', () => {
    let fixture: ComponentFixture<AdminNewsletterForm>;
    let component: any;
    let service: jasmine.SpyObj<AdminNewsletterService>;
    let navigate: jasmine.Spy;

    const valid = { subject: '  Novidades  ', body: 'Olá!', html: '', ctaLabel: '', ctaUrl: '' };
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const dialog = () => fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    async function settle() {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    async function setup(query: Record<string, string> = {}) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AdminNewsletterService, useValue: service },
                { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
            ],
        });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
        fixture = TestBed.createComponent(AdminNewsletterForm);
        component = fixture.componentInstance;
        await settle();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj('AdminNewsletterService', ['getNewsletter', 'createNewsletter', 'sendTest', 'sendToPending']);
        service.createNewsletter.and.resolveTo('new-id');
        service.sendTest.and.resolveTo();
        service.sendToPending.and.resolveTo({ sent: 10, failed: 0, remaining: 0, total: 10 });
    });

    afterEach(() => {
        if (dialog()?.open) dialog().close();
    });

    describe('validation', () => {
        beforeEach(() => setup());

        it('starts invalid', () => {
            expect(component.form.invalid).toBeTrue();
        });

        it('requires subject and body', () => {
            component.form.patchValue({ subject: 'x' });
            expect(component.form.invalid).toBeTrue();
            component.form.patchValue({ body: 'y' });
            expect(component.form.valid).toBeTrue();
        });

        it('accepts an empty link or an http(s) link and rejects anything else', () => {
            component.form.patchValue({ subject: 'x', body: 'y' });
            for (const ok of ['', 'http://a.com', 'https://semeandodevs.com.br/cursos?x=1']) {
                component.form.patchValue({ ctaUrl: ok });
                expect(component.form.valid).withContext(ok).toBeTrue();
            }
            for (const bad of ['semeandodevs.com.br', 'ftp://a.com', 'javascript:alert(1)', 'https://a b.com']) {
                component.form.patchValue({ ctaUrl: bad });
                expect(component.form.invalid).withContext(bad).toBeTrue();
            }
        });

        it('shows field errors only after the field was touched', () => {
            expect(component.showError('subject')).toBeFalse();
            component.form.controls.subject.markAsTouched();
            expect(component.showError('subject')).toBeTrue();
        });

        it('does not open the save dialog and shows the errors when the form is invalid', async () => {
            component.openSaveDialog();
            await settle();

            expect(dialog().open).toBeFalse();
            expect(text()).toContain('Informe o assunto.');
            expect(text()).toContain('Informe a mensagem.');
        });

        it('opens the save dialog in the confirm step when the form is valid', async () => {
            component.form.patchValue(valid);
            component.saveError.set('antigo');
            component.saveStep.set('done');

            component.openSaveDialog();
            await settle();

            expect(dialog().open).toBeTrue();
            expect(component.saveStep()).toBe('confirm');
            expect(component.saveError()).toBeNull();
        });
    });

    describe('preview', () => {
        beforeEach(() => setup());

        it('follows what is typed', async () => {
            component.form.patchValue({ subject: 'Oi', body: 'Mensagem de teste' });
            await settle();
            expect(fixture.nativeElement.querySelector('app-newsletter-preview iframe').getAttribute('srcdoc')).toContain('Mensagem de teste');
        });
    });

    describe('test e-mail', () => {
        beforeEach(() => setup());

        it('does not send an invalid draft', async () => {
            await component.sendTest();
            expect(service.sendTest).not.toHaveBeenCalled();
            expect(component.form.controls.subject.touched).toBeTrue();
        });

        it('sends the trimmed draft and reports success', async () => {
            component.form.patchValue({ ...valid, ctaLabel: ' Ver ', ctaUrl: 'https://a.com' });

            await component.sendTest();

            expect(service.sendTest).toHaveBeenCalledWith(
                { subject: 'Novidades', body: 'Olá!', html: null, ctaLabel: 'Ver', ctaUrl: 'https://a.com' },
                jasmine.any(String),
            );
            expect(component.testResult().ok).toBeTrue();
            expect(component.testResult().message).toMatch(/^Teste enviado para /);
            expect(component.isSendingTest()).toBeFalse();
        });

        it('reports failures', async () => {
            service.sendTest.and.rejectWith(new Error('provedor fora do ar'));
            component.form.patchValue(valid);

            await component.sendTest();

            expect(component.testResult()).toEqual({ ok: false, message: 'provedor fora do ar' });
        });

        it('uses a default failure message', async () => {
            service.sendTest.and.rejectWith({});
            component.form.patchValue(valid);
            await component.sendTest();
            expect(component.testResult()!.message).toBe('Não foi possível enviar o teste.');
        });
    });

    describe('saving', () => {
        beforeEach(async () => {
            await setup();
            component.form.patchValue(valid);
        });

        it('saves only, then goes back to the list', async () => {
            component.openSaveDialog();
            await settle();

            await component.save(false);

            expect(service.createNewsletter).toHaveBeenCalledWith({ subject: 'Novidades', body: 'Olá!', html: null, ctaLabel: null, ctaUrl: null });
            expect(service.sendToPending).not.toHaveBeenCalled();
            expect(navigate).toHaveBeenCalledWith(['/admin/envio-de-newsletter']);
            expect(component.isSaving()).toBeFalse();
        });

        it('keeps a custom html when given', async () => {
            component.form.patchValue({ html: '  <p>oi</p>  ' });
            await component.save(false);
            expect(service.createNewsletter.calls.mostRecent().args[0].html).toBe('<p>oi</p>');
        });

        it('saves and sends to everyone pending, leaving when all were delivered', async () => {
            await component.save(true);

            expect(service.sendToPending).toHaveBeenCalledWith('new-id', jasmine.any(Function));
            expect(navigate).toHaveBeenCalledWith(['/admin/envio-de-newsletter']);
        });

        it('tracks the progress while sending', async () => {
            let release!: () => void;
            service.sendToPending.and.callFake(async (_id, onProgress) => {
                onProgress({ sent: 3, failed: 0, remaining: 7, total: 10 });
                await new Promise<void>(r => (release = r));
                return { sent: 10, failed: 0, remaining: 0, total: 10 };
            });

            const pending = component.save(true);
            await wait(0);
            expect(component.saveStep()).toBe('sending');
            expect(component.sendProgress()).toEqual({ sent: 3, failed: 0, remaining: 7, total: 10 });

            release();
            await pending;
        });

        it('stays on the result step when some deliveries failed or are pending', async () => {
            service.sendToPending.and.resolveTo({ sent: 8, failed: 2, remaining: 0, total: 10 });

            await component.save(true);

            expect(component.saveStep()).toBe('done');
            expect(navigate).not.toHaveBeenCalled();
            expect(component.sendProgress()!.failed).toBe(2);
            expect(component.isSaving()).toBeFalse();
        });

        it('says the newsletter was saved when only the sending fails', async () => {
            service.sendToPending.and.rejectWith(new Error('provedor fora do ar'));

            await component.save(true);

            expect(component.saveError()).toBe('A newsletter foi salva, mas o envio falhou: provedor fora do ar');
            expect(component.saveStep()).toBe('done');
            expect(navigate).not.toHaveBeenCalled();
        });

        it('uses an "unknown error" text when the sending failure has no message', async () => {
            service.sendToPending.and.rejectWith({});
            await component.save(true);
            expect(component.saveError()).toBe('A newsletter foi salva, mas o envio falhou: erro desconhecido');
        });

        it('does not send when saving fails', async () => {
            service.createNewsletter.and.rejectWith(new Error('sem permissão'));

            await component.save(true);

            expect(component.saveError()).toBe('sem permissão');
            expect(service.sendToPending).not.toHaveBeenCalled();
            expect(component.saveStep()).toBe('confirm');
            expect(component.isSaving()).toBeFalse();
        });

        it('uses a default save error', async () => {
            service.createNewsletter.and.rejectWith({});
            await component.save(false);
            expect(component.saveError()).toBe('Não foi possível salvar a newsletter.');
        });

        it('does not let Escape close the dialog while sending', () => {
            component.saveStep.set('sending');
            const event = new Event('cancel', { cancelable: true });
            component.onSaveDialogCancel(event);
            expect(event.defaultPrevented).toBeTrue();

            component.saveStep.set('confirm');
            const other = new Event('cancel', { cancelable: true });
            component.onSaveDialogCancel(other);
            expect(other.defaultPrevented).toBeFalse();
        });
    });

    describe('duplicating', () => {
        it('starts empty without the query param', async () => {
            await setup();
            expect(service.getNewsletter).not.toHaveBeenCalled();
            expect(component.form.getRawValue().subject).toBe('');
        });

        it('fills the form from the source newsletter', async () => {
            service.getNewsletter.and.resolveTo({
                id: 'n1', subject: 'Original', body: 'Corpo', html: '<p>x</p>', cta_label: 'Ver', cta_url: 'https://a.com', created_at: '',
            } as any);

            await setup({ duplicar: 'n1' });

            expect(service.getNewsletter).toHaveBeenCalledWith('n1');
            expect(component.form.getRawValue()).toEqual({ subject: 'Original', body: 'Corpo', html: '<p>x</p>', ctaLabel: 'Ver', ctaUrl: 'https://a.com' });
        });

        it('uses empty strings for missing optional fields', async () => {
            service.getNewsletter.and.resolveTo({ id: 'n1', subject: null, body: 'Corpo', html: null, cta_label: null, cta_url: null } as any);
            await setup({ duplicar: 'n1' });
            expect(component.form.getRawValue()).toEqual({ subject: '', body: 'Corpo', html: '', ctaLabel: '', ctaUrl: '' });
        });

        it('warns when the source does not exist', async () => {
            service.getNewsletter.and.resolveTo(null);
            await setup({ duplicar: 'x' });

            expect(text()).toContain('A newsletter a ser duplicada não foi encontrada.');
        });

        it('warns when loading the source fails', async () => {
            service.getNewsletter.and.rejectWith(new Error('sem conexão'));
            await setup({ duplicar: 'x' });
            expect(text()).toContain('sem conexão');
        });

        it('uses a default message when loading fails without one', async () => {
            service.getNewsletter.and.rejectWith({});
            await setup({ duplicar: 'x' });
            expect(component.duplicateError()).toBe('Não foi possível carregar a newsletter a ser duplicada.');
        });
    });
});
