import { afterNextRender, booleanAttribute, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { burstConfetti, Gsap, loadGsap, prefersReducedMotion } from '../utils/motion';

/**
 * Anima os descendentes marcados com data-motion:
 * "item" (entrada em cascata), "pop" (entrada com ressalto), "count" (contagem do primeiro número do texto)
 * e círculos SVG com stroke-dasharray (preenchimento do anel).
 */
@Directive({ selector: '[appMotionReveal]' })
export class MotionReveal {
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    readonly motionCelebrate = input(false, { transform: booleanAttribute });

    constructor() {
        let context: { revert(): void } | undefined;
        let destroyed = false;
        inject(DestroyRef).onDestroy(() => {
            destroyed = true;
            context?.revert();
        });

        afterNextRender(async () => {
            if (prefersReducedMotion()) return;
            const gsap = await loadGsap();
            if (destroyed) return;
            context = gsap.context(() => this.play(gsap), this.host);
        });
    }

    private play(gsap: Gsap): void {
        const query = (selector: string) => Array.from(this.host.querySelectorAll<HTMLElement>(selector));

        const pops = query('[data-motion="pop"]');
        if (pops.length) {
            gsap.from(pops, { scale: 0.85, opacity: 0, duration: 0.8, delay: 0.1, ease: 'back.out(1.7)' });
        }

        const items = query('[data-motion="item"]');
        if (items.length) {
            gsap.from(items, { opacity: 0, y: 20, duration: 0.6, delay: 0.15, stagger: 0.1, ease: 'power3.out', clearProps: 'opacity,transform' });
        }

        this.host.querySelectorAll<SVGCircleElement>('circle[stroke-dasharray]').forEach(circle => {
            const full = parseFloat(circle.getAttribute('stroke-dasharray') ?? '');
            const target = parseFloat(circle.getAttribute('stroke-dashoffset') ?? '');
            if (Number.isNaN(full) || Number.isNaN(target)) return;
            gsap.fromTo(circle, { strokeDashoffset: full }, { strokeDashoffset: target, duration: 1.4, delay: 0.2, ease: 'power2.out' });
        });

        query('[data-motion="count"]').forEach(el => {
            const node = el.firstChild;
            const original = node?.nodeType === Node.TEXT_NODE ? (node.nodeValue ?? '') : '';
            const digits = original.match(/\d+/)?.[0];
            if (!node || !digits) return;
            const state = { value: 0 };
            const render = (value: number) => (node.nodeValue = original.replace(digits, String(Math.round(value))));
            render(0);
            gsap.to(state, { value: Number(digits), duration: 1.2, delay: 0.3, ease: 'power2.out', onUpdate: () => render(state.value), onComplete: () => (node.nodeValue = original) });
        });

        if (this.motionCelebrate()) {
            gsap.delayedCall(0.45, () => burstConfetti(gsap, this.host));
        }
    }
}
