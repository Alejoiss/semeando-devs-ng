import { DestroyRef, Directive, ElementRef, effect, inject, input, untracked } from '@angular/core';
import { loadGsap, prefersReducedMotion } from '../utils/motion';

/**
 * Escreve `prefix + número + suffix` no elemento e anima a contagem sempre que o valor muda.
 * Diferente do data-motion="count", reage a valores que chegam depois da renderização.
 */
@Directive({ selector: '[appCountUp]', standalone: true })
export class CountUp {
    readonly value = input.required<number>({ alias: 'appCountUp' });
    readonly prefix = input('');
    readonly suffix = input('');

    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    constructor() {
        let tween: { kill(): void } | undefined;
        let shown = 0;
        let run = 0;
        let destroyed = false;

        inject(DestroyRef).onDestroy(() => {
            destroyed = true;
            tween?.kill();
        });

        effect(() => {
            const target = this.value();
            const prefix = untracked(this.prefix);
            const suffix = untracked(this.suffix);
            const render = (n: number) => (this.host.textContent = `${prefix}${Math.round(n)}${suffix}`);
            const current = ++run;

            tween?.kill();

            if (prefersReducedMotion() || typeof matchMedia !== 'function' || target === shown) {
                shown = target;
                render(target);
                return;
            }

            render(shown);
            loadGsap().then(gsap => {
                if (destroyed || current !== run) return;
                const state = { value: shown };
                tween = gsap.to(state, {
                    value: target,
                    duration: 1.2,
                    ease: 'power2.out',
                    onUpdate: () => {
                        shown = state.value;
                        render(state.value);
                    },
                    onComplete: () => {
                        shown = target;
                        render(target);
                    },
                });
            });
        });
    }
}
