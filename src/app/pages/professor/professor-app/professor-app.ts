import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-professor-app',
  imports: [],
  template: `
    <div class="p-8">
      <h1 class="text-3xl font-display text-primary">Área do Professor</h1>
      <p class="text-on_surface/60 mt-4">
        Bem-vindo à base da Área do Professor. Implementação em progresso.
      </p>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorApp {
}
