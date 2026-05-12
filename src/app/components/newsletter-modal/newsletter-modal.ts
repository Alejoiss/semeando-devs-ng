import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NewsletterService, UnviewedNewsletterResult } from '../../services/newsletter';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-newsletter-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './newsletter-modal.html',
  styleUrl: './newsletter-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }))
      ])
    ]),
    trigger('overlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class NewsletterModal implements OnInit {
  private readonly newsletterService = inject(NewsletterService);
  
  protected newsletterData = signal<UnviewedNewsletterResult | null>(null);
  protected isVisible = signal(false);
  protected isLoading = signal(false);

  async ngOnInit() {
    await this.checkNextNewsletter();
  }

  async closeAndAcknowledge() {
    const data = this.newsletterData();
    if (!data || this.isLoading()) return;

    this.isLoading.set(true);
    const success = await this.newsletterService.markAsViewed(data.newsletter_id);
    if (success) {
      this.isVisible.set(false);
      // Wait for exit animation
      setTimeout(async () => {
        this.newsletterData.set(null);
        await this.checkNextNewsletter();
      }, 300);
    } else {
      this.isLoading.set(false);
    }
  }

  private async checkNextNewsletter() {
    this.isLoading.set(true);
    const data = await this.newsletterService.fetchUnviewedNewsletter();
    if (data) {
      this.newsletterData.set(data);
      this.isVisible.set(true);
    }
    this.isLoading.set(false);
  }

  protected onCtaClick() {
    const url = this.newsletterData()?.newsletter?.cta_url;
    this.closeAndAcknowledge();
    if (url) {
      // Small delay to allow the animation to start before navigating away if it's the same tab,
      // but usually window.open is better
      window.open(url, '_blank');
    }
  }
}
