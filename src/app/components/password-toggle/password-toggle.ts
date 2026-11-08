import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-password-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary transition-colors"
      [attr.aria-label]="visible() ? 'Ocultar senha' : 'Mostrar senha'"
      [attr.aria-pressed]="visible()"
      (click)="toggle()"
    >
      <span class="material-symbols-outlined text-[22px]" aria-hidden="true">{{
        visible() ? 'visibility_off' : 'visibility'
      }}</span>
    </button>
  `,
})
export class PasswordToggle {
  readonly input = input.required<HTMLInputElement>();
  protected readonly visible = signal(false);

  protected toggle(): void {
    const next = !this.visible();
    this.visible.set(next);
    this.input().type = next ? 'text' : 'password';
  }
}
