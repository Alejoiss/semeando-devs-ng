import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NewsletterModal } from './newsletter-modal';
import { NewsletterService } from '../../services/newsletter';

describe('NewsletterModal', () => {
  let component: NewsletterModal;
  let fixture: ComponentFixture<NewsletterModal>;
  let mockNewsletterService: jasmine.SpyObj<NewsletterService>;

  beforeEach(async () => {
    mockNewsletterService = jasmine.createSpyObj('NewsletterService', ['fetchUnviewedNewsletter', 'markAsViewed']);

    await TestBed.configureTestingModule({
      imports: [NewsletterModal],
      providers: [
        { provide: NewsletterService, useValue: mockNewsletterService },
      ]
    })
    .compileComponents();
  });

  it('fetch and display unviewed newsletter on home screen', fakeAsync(() => {
    mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve({
      user_id: '123',
      newsletter_id: '456',
      email_sent: false,
      viewed: false,
      newsletter: { id: '456', body: 'Test body', cta_label: null, cta_url: null }
    }));

    fixture = TestBed.createComponent(NewsletterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(); // wait for fetchUnviewedNewsletter
    fixture.detectChanges();

    expect(mockNewsletterService.fetchUnviewedNewsletter).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('Test body');
  }));

  it('render correct CTA or default close button', fakeAsync(() => {
    mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve({
      user_id: '123',
      newsletter_id: '456',
      email_sent: false,
      viewed: false,
      newsletter: { id: '456', body: 'Test body', cta_label: 'Custom CTA', cta_url: 'http://example.com' }
    }));

    fixture = TestBed.createComponent(NewsletterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).toContain('Custom CTA');
    expect(compiled.innerHTML).toContain('Fechar'); // Close icon or close button logic
  }));

  it('acknowledge newsletter and close modal', fakeAsync(() => {
    mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve({
      user_id: '123',
      newsletter_id: '456',
      email_sent: false,
      viewed: false,
      newsletter: { id: '456', body: 'Test body', cta_label: null, cta_url: null }
    }));
    mockNewsletterService.markAsViewed.and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(NewsletterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve(null));

    // Call closeAndAcknowledge (usually triggered by button)
    component.closeAndAcknowledge();
    tick();
    fixture.detectChanges();

    expect(mockNewsletterService.markAsViewed).toHaveBeenCalledWith('456');
    tick(400); // wait for setTimeout animation delay
    expect(component['newsletterData']()).toBeNull();
  }));

  describe('accessibility', () => {
    const newsletter = {
      user_id: '123',
      newsletter_id: '456',
      email_sent: false,
      viewed: false,
      newsletter: { id: '456', body: 'Test body', cta_label: 'Custom CTA', cta_url: 'http://example.com' }
    };

    const open = () => {
      mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve(newsletter));
      mockNewsletterService.markAsViewed.and.returnValue(Promise.resolve(true));
      fixture = TestBed.createComponent(NewsletterModal);
      component = fixture.componentInstance;
      fixture.detectChanges();
      return Promise.resolve().then(() => fixture.whenStable()).then(() => fixture.detectChanges());
    };

    const dialog = () => (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]') as HTMLElement;

    it('is a modal dialog named by its heading, with a labelled close button', async () => {
      await open();

      expect(dialog().getAttribute('aria-modal')).toBe('true');
      const title = (fixture.nativeElement as HTMLElement).querySelector('#' + dialog().getAttribute('aria-labelledby'));
      expect(title?.textContent?.trim()).toBe('Novidade');
      expect((fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Fechar janela"]')).toBeTruthy();
    });

    it('moves focus into the dialog when it opens', async () => {
      await open();
      fixture.detectChanges();

      expect(document.activeElement).toBe(dialog());
    });

    it('returns focus to the element that had it before the dialog opened', fakeAsync(() => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve(newsletter));
      mockNewsletterService.markAsViewed.and.returnValue(Promise.resolve(true));
      fixture = TestBed.createComponent(NewsletterModal);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(document.activeElement).toBe(dialog());

      mockNewsletterService.fetchUnviewedNewsletter.and.returnValue(Promise.resolve(null));
      component.closeAndAcknowledge();
      tick(400);

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    }));

    it('closes and acknowledges with Escape', async () => {
      await open();

      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(mockNewsletterService.markAsViewed).toHaveBeenCalledWith('456');
    });

    it('keeps Tab inside the dialog by wrapping around its buttons', async () => {
      await open();
      const buttons = Array.from(dialog().querySelectorAll<HTMLElement>('button:not([disabled])'));
      const last = buttons[buttons.length - 1];
      last.focus();

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      dialog().dispatchEvent(event);

      expect(event.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(buttons[0]);
    });
  });
});
