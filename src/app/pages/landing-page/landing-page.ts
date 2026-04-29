import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MarkdownModule } from 'ngx-markdown';

import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [CommonModule, RouterModule, Footer, Header, MarkdownModule],
    templateUrl: './landing-page.html',
    styleUrls: ['./landing-page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
    protected readonly codeSnippet = signal(`\`\`\`javascript
function calcularXP(lessons) {
  return lessons.reduce((acc, lesson) => {
    return acc + lesson.xp;
  }, 0);
}

// O Mentor IA está analisando seu código...
\`\`\``);
}
