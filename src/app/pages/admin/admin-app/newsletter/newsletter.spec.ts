import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminNewsletter } from './newsletter';
import { AdminNewsletterService } from '../../../../services/admin-newsletter';

describe('AdminNewsletter', () => {
    let fixture: ComponentFixture<AdminNewsletter>;
    let component: any;
    let service: jasmine.SpyObj<AdminNewsletterService>;
    let navigate: jasmine.Spy;

    const item = (over: object = {}) => ({ id: 'n1', subject: 'Novidades', created_at: '2026-11-10T12:00:00', ...over });

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const lastParams = () => service.getNewsletters.calls.mostRecent().args[0];
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
    const dialog = () => fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    const dialogButton = (label: string) =>
        Array.from(dialog().querySelectorAll('button')).find(b => b.textContent!.includes(label)) as HTMLButtonElement;

    async function settle() {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    // o evento `close` do <dialog> é disparado em uma tarefa posterior ao close()
    async function settleAfterClose() {
        await wait(30);
        await settle();
    }

    async function setup() {
        fixture = TestBed.createComponent(AdminNewsletter);
        component = fixture.componentInstance;
        await settle();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj('AdminNewsletterService', ['getNewsletters', 'sendToPending']);
        service.getNewsletters.and.resolveTo({ newsletters: [item(), item({ id: 'n2', subject: '' })] as any, total: 2 });
        TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AdminNewsletterService, useValue: service }] });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    });

    afterEach(() => {
        if (dialog()?.open) dialog().close();
    });

    describe('listing', () => {
        it('loads the first page, newest first', async () => {
            await setup();
            expect(lastParams()).toEqual({ search: '', sortDir: 'desc', page: 0, pageSize: 20 });
        });

        it('shows subject (or "Sem assunto") and date', async () => {
            await setup();

            expect(text()).toContain('Novidades');
            expect(text()).toContain('Sem assunto');
            expect(text()).toContain('10/11/2026');
        });

        it('offers duplicate and resend actions with accessible names', async () => {
            await setup();

            expect(fixture.nativeElement.querySelector('[aria-label="Duplicar newsletter Novidades"]')).toBeTruthy();
            expect(fixture.nativeElement.querySelector('[aria-label="Reenviar newsletter Novidades"]')).toBeTruthy();
            expect(fixture.nativeElement.querySelector('[aria-label="Reenviar newsletter sem assunto"]')).toBeTruthy();
        });

        it('shows the empty state', async () => {
            service.getNewsletters.and.resolveTo({ newsletters: [], total: 0 });
            await setup();
            expect(text()).toContain('Nenhuma newsletter encontrada.');
            expect(text()).toContain('0 newsletters');
        });

        it('shows an error with a retry button', async () => {
            service.getNewsletters.and.rejectWith(new Error('sem conexão'));
            await setup();
            expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('sem conexão');

            service.getNewsletters.and.resolveTo({ newsletters: [item()] as any, total: 1 });
            (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
            await settle();
            expect(text()).toContain('Novidades');
        });

        it('opens the detail page when a row is clicked', async () => {
            await setup();
            (fixture.nativeElement.querySelector('tbody tr') as HTMLElement).click();
            expect(navigate).toHaveBeenCalledWith(['/admin/envio-de-newsletter', 'n1']);
        });
    });

    describe('search, sort and pagination', () => {
        it('searches after a debounce, going back to the first page', async () => {
            await setup();
            component.currentPage.set(2);
            await settle();

            component.searchControl.setValue('black friday');
            await wait(350);
            await settle();

            expect(lastParams().search).toBe('black friday');
            expect(lastParams().page).toBe(0);
        });

        it('toggles the sort direction and exposes it as aria-sort', async () => {
            await setup();
            const th = () => fixture.nativeElement.querySelector('th[aria-sort]') as HTMLElement;
            expect(th().getAttribute('aria-sort')).toBe('descending');

            component.toggleSort();
            await settle();

            expect(lastParams().sortDir).toBe('asc');
            expect(th().getAttribute('aria-sort')).toBe('ascending');
        });

        it('paginates', async () => {
            service.getNewsletters.and.resolveTo({ newsletters: [item()] as any, total: 45 });
            await setup();
            expect(text()).toContain('1–20 de 45 newsletters');

            (fixture.nativeElement.querySelector('button[aria-label="Próxima página"]') as HTMLButtonElement).click();
            await settle();

            expect(lastParams().page).toBe(1);
            expect(text()).toContain('21–40 de 45 newsletters');
        });
    });

    describe('resending', () => {
        const openResend = async (label = 'Reenviar newsletter Novidades') => {
            (fixture.nativeElement.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement).click();
            await settle();
        };

        it('asks for confirmation first, without opening the detail page', async () => {
            await setup();
            await openResend();

            expect(dialog().open).toBeTrue();
            expect(dialog().textContent).toContain('Reenviar newsletter');
            expect(dialog().textContent).toContain('apenas para os alunos inscritos que ainda não o receberam');
            expect(navigate).not.toHaveBeenCalled();
            expect(service.sendToPending).not.toHaveBeenCalled();
        });

        it('sends to the pending students and shows the final progress', async () => {
            service.sendToPending.and.callFake(async (_id, onProgress) => {
                onProgress({ sent: 5, failed: 0, remaining: 5, total: 10 });
                return { sent: 10, failed: 0, remaining: 0, total: 10 };
            });
            await setup();
            await openResend();

            dialogButton('Reenviar').click();
            await settle();

            expect(service.sendToPending).toHaveBeenCalledWith('n1', jasmine.any(Function));
            expect(component.resendStep()).toBe('done');
            expect(dialog().textContent).toContain('10 de 10 enviados');
            expect(dialog().textContent).not.toContain('Restam');
        });

        it('warns when some students are still pending', async () => {
            service.sendToPending.and.resolveTo({ sent: 4, failed: 1, remaining: 3, total: 8 });
            await setup();
            await openResend();

            dialogButton('Reenviar').click();
            await settle();

            expect(dialog().textContent).toContain('Restam 3 sem receber');
            expect(dialog().textContent).toContain('1 com falha');
        });

        it('shows the error when sending fails', async () => {
            service.sendToPending.and.rejectWith(new Error('provedor fora do ar'));
            await setup();
            await openResend();

            dialogButton('Reenviar').click();
            await settle();

            expect(component.resendStep()).toBe('done');
            expect(dialog().querySelector('[role="alert"]')!.textContent).toContain('provedor fora do ar');
        });

        it('uses a default error message', async () => {
            service.sendToPending.and.rejectWith({});
            await setup();
            await openResend();

            await component.confirmResend();

            expect(component.resendError()).toBe('Não foi possível enviar a newsletter.');
        });

        it('says so when nobody was pending', async () => {
            service.sendToPending.and.rejectWith(new Error('x'));
            await setup();
            await openResend();
            component.resendError.set(null);
            component.resendProgress.set(null);
            component.resendStep.set('done');
            await settle();

            expect(dialog().textContent).toContain('Não há alunos pendentes para esta newsletter.');
        });

        it('does not let Escape close the dialog while sending', async () => {
            await setup();
            await openResend();
            component.resendStep.set('sending');

            const event = new Event('cancel', { cancelable: true });
            dialog().dispatchEvent(event);

            expect(event.defaultPrevented).toBeTrue();
        });

        it('lets Escape close the dialog when not sending', async () => {
            await setup();
            await openResend();

            const event = new Event('cancel', { cancelable: true });
            dialog().dispatchEvent(event);

            expect(event.defaultPrevented).toBeFalse();
        });

        it('cancels, clears the selection and returns focus to the trigger', async () => {
            await setup();
            const trigger = fixture.nativeElement.querySelector('[aria-label="Reenviar newsletter Novidades"]') as HTMLButtonElement;
            await openResend();

            dialogButton('Cancelar').click();
            await settleAfterClose();

            expect(dialog().open).toBeFalse();
            expect(component.resending()).toBeNull();
            expect(document.activeElement).toBe(trigger);
        });

        it('resets the previous result when opening for another newsletter', async () => {
            service.sendToPending.and.resolveTo({ sent: 1, failed: 0, remaining: 0, total: 1 });
            await setup();
            await openResend();
            dialogButton('Reenviar').click();
            await settle();
            dialogButton('Fechar').click();
            await settleAfterClose();

            await openResend('Reenviar newsletter sem assunto');

            expect(component.resendStep()).toBe('confirm');
            expect(component.resendProgress()).toBeNull();
            expect(dialog().textContent).toContain('Sem assunto');
        });
    });
});
