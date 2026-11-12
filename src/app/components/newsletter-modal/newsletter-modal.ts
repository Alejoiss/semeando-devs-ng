import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NewsletterService, UnviewedNewsletterResult } from '../../services/newsletter';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-newsletter-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './newsletter-modal.html',
  styleUrl: './newsletter-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
