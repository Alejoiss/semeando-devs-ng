import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { Gsap, loadGsap, prefersReducedMotion } from '../../utils/motion';

@Component({
    selector: 'app-brand-loader',
    standalone: true,
    templateUrl: './brand-loader.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-flex' },
})
export class BrandLoader {
    readonly size = input(72);
    readonly label = input('Carregando');
    readonly loop = input(true);

    private readonly logo = viewChild.required<ElementRef<SVGElement>>('logo');

    constructor() {
        let context: { revert(): void } | undefined;
        let destroyed = false;
        inject(DestroyRef).onDestroy(() => {
            destroyed = true;
            this.destroyObserver?.();
            context?.revert();
        });

        afterNextRender(async () => {
            if (prefersReducedMotion()) return;
            const gsap = await loadGsap();
            if (destroyed) return;
            context = gsap.context(() => {
                const lines = this.logo().nativeElement.querySelectorAll('.brand-line');
                if (!this.loop()) {
                    this.playOnView(gsap, lines);
                    return;
                }
                gsap.timeline({ repeat: -1, repeatDelay: 0.15 })
                    .fromTo(lines, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(2.2)' })
                    .to(lines, { scale: 1.12, duration: 0.35, stagger: { each: 0.05, yoyo: true, repeat: 1 }, ease: 'sine.inOut' }, '+=0.1')
                    .to(lines, { opacity: 0, scale: 0.6, duration: 0.35, stagger: 0.06, ease: 'power2.in' }, '+=0.2');
            }, this.logo().nativeElement);
        });
    }

    private playOnView(gsap: Gsap, lines: NodeListOf<Element>) {
        const logo = this.logo().nativeElement;
        const timeline = gsap
            .timeline({ paused: true })
            .fromTo(lines, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(2.2)' })
            .to(lines, { scale: 1.12, duration: 0.35, stagger: { each: 0.05, yoyo: true, repeat: 1 }, ease: 'sine.inOut' }, '+=0.1');
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            timeline.play();
            observer.disconnect();
        }, { threshold: 0.6 });
        observer.observe(logo);
        this.destroyObserver = () => observer.disconnect();
    }

    private destroyObserver?: () => void;
}
