import { Component, signal, viewChild, ElementRef } from '@angular/core';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [Header, Footer],
  templateUrl: './terms-of-use.html',
  styleUrl: './terms-of-use.scss',
  host: {
    '(window:scroll)': 'onWindowScroll()'
  }
})
export class TermsOfUse {
  readonly indexSection = viewChild<ElementRef<HTMLElement>>('indexSection');
  protected readonly showBackToTop = signal(false);

  onWindowScroll() {
    const element = this.indexSection()?.nativeElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      // Show button if the bottom of the index section is above the top of the viewport
      this.showBackToTop.set(rect.bottom < 0);
    } else {
      // Fallback if indexSection is not yet available, show after 600px scroll
      this.showBackToTop.set(window.scrollY > 600);
    }
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 120; // Padding to account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

