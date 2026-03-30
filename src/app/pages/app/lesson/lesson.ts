import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';

@Component({
    selector: 'app-lesson',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownModule],
    templateUrl: './lesson.html',
    styleUrls: ['./lesson.scss']
})
export class Lesson {
    codeSnippet = `
\`\`\`html
<header>
  <nav>
    <ul>
      <li>Home</li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>O Poder da Semântica</h1>
    <p>Conteúdo importante aqui...</p>
  </article>
</main>
\`\`\`
`;
}
