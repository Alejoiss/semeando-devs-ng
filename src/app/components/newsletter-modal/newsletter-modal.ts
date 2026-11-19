import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, OnInit, signal, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private previouslyFocused: HTMLElement | null = null;
  
  protected newsletterData = signal<UnviewedNewsletterResult | null>(null);
  protected isVisible = signal(false);
  protected isLoading = signal(false);

  constructor() {
    effect(() => {
      const dialog = this.dialog();
      if (dialog) {
        this.previouslyFocused ??= this.document.activeElement as HTMLElement | null;
        dialog.nativeElement.focus();
      }
    });
  }

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
        this.restoreFocus();
        await this.checkNextNewsletter();
      }, 300);
    } else {
      this.isLoading.set(false);
    }
  }

  protected trapFocus(event: Event) {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    const backwards = (event as KeyboardEvent).shiftKey;

    if (backwards && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!backwards && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreFocus() {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (target && this.document.contains(target)) {
      target.focus();
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
