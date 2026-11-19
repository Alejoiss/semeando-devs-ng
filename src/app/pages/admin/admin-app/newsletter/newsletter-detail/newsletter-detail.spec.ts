import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AdminNewsletterDetail } from './newsletter-detail';
import { AdminNewsletterService } from '../../../../../services/admin-newsletter';

describe('AdminNewsletterDetail', () => {
    let fixture: ComponentFixture<AdminNewsletterDetail>;
    let service: jasmine.SpyObj<AdminNewsletterService>;
    let params$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

    const newsletter = {
        id: 'n1',
        subject: 'Novidades de novembro',
        body: 'Olá, aluno!',
        html: null,
        cta_label: 'Ver novidades',
        cta_url: 'https://semeandodevs.com.br',
        created_at: '2026-11-10T12:00:00Z',
    };

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

    async function setup() {
        params$ = new BehaviorSubject(convertToParamMap({ id: 'n1' }));
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AdminNewsletterService, useValue: service },
                { provide: ActivatedRoute, useValue: { paramMap: params$ } },
            ],
        });
        fixture = TestBed.createComponent(AdminNewsletterDetail);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj('AdminNewsletterService', ['getNewsletter']);
        service.getNewsletter.and.resolveTo(newsletter as any);
    });

    it('loads the newsletter of the route id', async () => {
        await setup();
        expect(service.getNewsletter).toHaveBeenCalledWith('n1');
    });

    it('shows a loading status first', async () => {
        service.getNewsletter.and.returnValue(new Promise(() => undefined));
        params$ = new BehaviorSubject(convertToParamMap({ id: 'n1' }));
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AdminNewsletterService, useValue: service },
                { provide: ActivatedRoute, useValue: { paramMap: params$ } },
            ],
        });
        fixture = TestBed.createComponent(AdminNewsletterDetail);
        fixture.detectChanges();
        await Promise.resolve();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('[role="status"]').getAttribute('aria-label')).toBe('Carregando newsletter');
    });

    it('shows subject, creation date and the e-mail preview', async () => {
        await setup();

        expect(text()).toContain('Novidades de novembro');
        expect(text()).toContain('Criada em 10/11/2026');
        expect(text()).toContain('E-mail enviado');
        expect(fixture.nativeElement.querySelector('app-newsletter-preview')).toBeTruthy();
    });

    it('links back to the newsletter list', async () => {
        await setup();
        expect(fixture.nativeElement.querySelector('header a').getAttribute('href')).toBe('/admin/envio-de-newsletter');
    });

    it('falls back to "Sem assunto" when the subject is empty', async () => {
        service.getNewsletter.and.resolveTo({ ...newsletter, subject: '' } as any);
        await setup();
        expect(text()).toContain('Sem assunto');
    });

    it('tells when the newsletter does not exist', async () => {
        service.getNewsletter.and.resolveTo(null);
        await setup();

        expect(text()).toContain('Newsletter não encontrada.');
        expect(fixture.nativeElement.querySelector('app-newsletter-preview')).toBeNull();
    });

    it('shows an alert and retries when loading fails', async () => {
        service.getNewsletter.and.rejectWith(new Error('down'));
        await setup();

        expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Não foi possível carregar a newsletter.');

        service.getNewsletter.and.resolveTo(newsletter as any);
        (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(service.getNewsletter).toHaveBeenCalledTimes(2);
        expect(text()).toContain('Novidades de novembro');
    });

    it('reloads when the route id changes', async () => {
        await setup();

        params$.next(convertToParamMap({ id: 'n2' }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(service.getNewsletter).toHaveBeenCalledWith('n2');
    });
});
