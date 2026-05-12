import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NewsletterModal } from './newsletter-modal';
import { NewsletterService } from '../../services/newsletter';
import { provideNoopAnimations } from '@angular/animations';

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
        provideNoopAnimations()
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

    // Call closeAndAcknowledge (usually triggered by button)
    component.closeAndAcknowledge();
    tick();
    fixture.detectChanges();

    expect(mockNewsletterService.markAsViewed).toHaveBeenCalledWith('456');
    tick(400); // wait for setTimeout animation delay
    expect(component['newsletterData']()).toBeNull();
  }));
});
