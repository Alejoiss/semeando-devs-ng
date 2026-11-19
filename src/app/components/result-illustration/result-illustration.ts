import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Gsap, loadGsap, prefersReducedMotion } from '../../utils/motion';

const BASE = '120 188';

@Component({
    selector: 'app-result-illustration',
    standalone: true,
    templateUrl: './result-illustration.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block', '[class.opacity-0]': '!ready()' },
})
export class ResultIllustration {
    readonly passed = input.required<boolean>();

    protected readonly ready = signal(false);

    private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');

    constructor() {
        let context: { revert(): void } | undefined;
        let destroyed = false;
        inject(DestroyRef).onDestroy(() => {
            destroyed = true;
            context?.revert();
        });

        afterNextRender(async () => {
            if (prefersReducedMotion()) {
                this.ready.set(true);
                return;
            }
            try {
                const gsap = await loadGsap();
                if (destroyed) return;
                const svg = this.svg().nativeElement;
                context = gsap.context(() => (this.passed() ? this.playPassed(gsap) : this.playFailed(gsap)), svg);
            } catch (error) {
                console.error('Error loading result illustration animation:', error);
            } finally {
                this.ready.set(true);
            }
        });
    }

    private growSeedling(gsap: Gsap) {
        return gsap
            .timeline()
            .from('.seed', { scale: 0, opacity: 0, svgOrigin: '120 186', duration: 0.4, ease: 'back.out(2.5)' })
            .to('.seed', { scale: 0.5, opacity: 0, svgOrigin: '120 186', duration: 0.35, ease: 'power2.in' }, '+=0.15')
            .from('.stem', { scaleY: 0, svgOrigin: BASE, duration: 1, ease: 'power2.out' }, '<0.1');
    }

    private playPassed(gsap: Gsap) {
        const tl = this.growSeedling(gsap)
            .fromTo('.branch', { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' }, '-=0.35')
            .from('.canopy-l', { scale: 0, svgOrigin: '76 90', duration: 0.5, ease: 'back.out(2)' }, '-=0.2')
            .from('.canopy-r', { scale: 0, svgOrigin: '164 90', duration: 0.5, ease: 'back.out(2)' }, '<0.1')
            .from('.facet', { scale: 0, opacity: 0, svgOrigin: '120 62', duration: 0.45, stagger: 0.08, ease: 'back.out(2.2)' }, '-=0.25')
            .from('.fruit', { scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.08, ease: 'back.out(3)' }, '-=0.1')
            .from('.bit', { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.08, ease: 'back.out(3)' }, '-=0.2');

        const loopStart = tl.duration();
        gsap.to('.plant', { rotation: 1.2, svgOrigin: BASE, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: loopStart });
        gsap.to('.bit', { y: -12, opacity: 0.35, duration: 1.4, yoyo: true, repeat: -1, stagger: 0.3, ease: 'sine.inOut', delay: loopStart });
    }

    private playFailed(gsap: Gsap) {
        const tl = this.growSeedling(gsap)
            .fromTo('.branch', { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' }, '-=0.35')
            .from('.canopy-l', { scale: 0, svgOrigin: '76 90', duration: 0.5, ease: 'back.out(2)' }, '-=0.2')
            .from('.facet', { scale: 0, opacity: 0, svgOrigin: '120 62', duration: 0.45, stagger: 0.08, ease: 'back.out(2.2)' }, '-=0.25')
            .from('.ghost', { fillOpacity: 0, duration: 0.6, stagger: 0.15, ease: 'power1.out' }, '+=0.1');

        gsap.to('.ghost', { fillOpacity: 0.5, duration: 1.1, yoyo: true, repeat: -1, stagger: 0.2, ease: 'sine.inOut', delay: tl.duration() });

        // Sem a copa da direita o peso fica todo à esquerda: a árvore tomba, quase passa do ponto e volta ao prumo.
        tl.to('.plant', { rotation: -14, svgOrigin: BASE, duration: 1.2, ease: 'power2.in' }, '+=0.4')
            .to('.plant', { rotation: -21, svgOrigin: BASE, duration: 0.4, ease: 'sine.inOut' })
            .to('.plant', { rotation: -17, svgOrigin: BASE, duration: 0.3, ease: 'sine.inOut' })
            .to('.plant', { rotation: 0, svgOrigin: BASE, duration: 1.8, ease: 'elastic.out(1, 0.35)' }, '+=0.15');

        gsap.to('.plant', { rotation: 1.2, svgOrigin: BASE, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: tl.duration() });
    }
}
