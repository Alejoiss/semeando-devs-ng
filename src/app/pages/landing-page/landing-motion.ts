import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export interface LandingMotion {
    swapMethodology(change: () => void): void;
    destroy(): void;
}

const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

export function initLandingMotion(root: HTMLElement, preloadImages: string[]): LandingMotion {
    const all = <T extends HTMLElement>(selector: string) => Array.from(root.querySelectorAll<T>(selector));
    const one = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector);

    preloadImages.forEach(src => (new Image().src = src));

    const mm = gsap.matchMedia(root);

    mm.add(NO_REDUCED_MOTION, () => {
        const cleanups = [heroIntro(), heroScroll(), reveals(), ranking(), scrollProgress()];
        return () => cleanups.forEach(cleanup => cleanup?.());
    });

    mm.add(`${NO_REDUCED_MOTION} and ${FINE_POINTER}`, () => pointerEffects());

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    function heroIntro() {
        const title = one('[data-hero="title"]');
        const gradient = one('.gradient-text');
        if (!title) return;

        SplitText.create(title, {
            type: 'lines,words',
            mask: 'lines',
            ignore: '.gradient-text',
            autoSplit: true,
            onSplit: self => gsap.from(self.words, { yPercent: 110, duration: 0.9, stagger: 0.07, delay: 0.2, ease: 'power3.out' }),
        });

        if (gradient) {
            gsap.from(gradient, { yPercent: 110, opacity: 0, duration: 0.9, delay: 0.65, ease: 'power3.out' });
        }
        gsap.from('[data-hero="badge"]', { y: -14, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('[data-hero="text"]', { y: 20, opacity: 0, duration: 0.7, delay: 0.9, ease: 'power3.out' });
        gsap.from('[data-hero="actions"]', { y: 20, opacity: 0, duration: 0.7, delay: 1.05, ease: 'power3.out' });
        gsap.from('[data-hero="shot"]', { y: 70, opacity: 0, duration: 1, delay: 1.1, ease: 'power3.out' });
    }

    function heroScroll() {
        const hero = one('#hero');
        const shot = one('[data-hero="shot"]');
        const card = one('[data-hero-card]');
        if (!hero || !shot || !card) return;

        card.style.transition = 'none';
        gsap.fromTo(
            card,
            { rotateX: 14, scale: 0.92, transformPerspective: 1200 },
            { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: shot, start: 'top 92%', end: 'top 35%', scrub: 0.6 } },
        );

        all('[data-orb]').forEach((orb, index) => {
            const direction = index % 2 ? -1 : 1;
            gsap.to(orb, { x: 40 * direction, y: -30 * direction, duration: 6 + index * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
            gsap.to(orb, {
                yPercent: -30 * direction,
                ease: 'none',
                scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
            });
        });

        return () => card.style.removeProperty('transition');
    }

    function reveals() {
        const targets = all('[data-reveal]');
        if (!targets.length) return;

        const baseOpacity = new Map(targets.map(el => [el, parseFloat(getComputedStyle(el).opacity)]));
        targets.forEach(el => (el.style.transition = 'none'));
        gsap.set(targets, { opacity: 0, y: 40 });

        ScrollTrigger.batch(targets, {
            start: 'top 88%',
            once: true,
            interval: 0.1,
            batchMax: 6,
            onEnter: batch =>
                gsap.to(batch, {
                    opacity: (_index, el) => baseOpacity.get(el) ?? 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.12,
                    ease: 'power3.out',
                    overwrite: true,
                    clearProps: 'opacity,transform,transition',
                }),
        });

        return () => targets.forEach(el => el.style.removeProperty('transition'));
    }

    function ranking() {
        const list = one('[data-rank-list]');
        const items = all('[data-rank-item]');
        if (!list || items.length < 2) return;

        const tops = items.map(item => item.offsetTop);
        const last = tops.length - 1;
        items.forEach(item => (item.style.transition = 'none'));
        gsap.set(items, { y: index => (index === 0 ? tops[last] - tops[0] : tops[index - 1] - tops[index]) });

        const counters = all('[data-rank-xp]').map(el => prepareCounter(el));

        ScrollTrigger.create({
            trigger: list,
            start: 'top 78%',
            once: true,
            onEnter: () => {
                gsap.to(items[0], { zIndex: 5, position: 'relative', duration: 0 });
                gsap.to(items, { y: 0, duration: 1.4, ease: 'power3.inOut', stagger: { each: 0.06, from: 'end' }, clearProps: 'transform,transition,position,zIndex' });
                counters.forEach(counter => counter.play());
            },
        });

        return () => items.forEach(item => item.style.removeProperty('transition'));
    }

    function prepareCounter(el: HTMLElement) {
        const node = el.firstChild;
        const original = node?.nodeType === Node.TEXT_NODE ? (node.nodeValue ?? '') : '';
        const digits = original.match(/[\d.]+/)?.[0];
        const target = digits ? Number(digits.replace(/\./g, '')) : NaN;
        const render = (value: number) => node && digits && (node.nodeValue = original.replace(digits, Math.round(value).toLocaleString('pt-BR')));
        const state = { value: 0 };
        if (Number.isNaN(target)) return { play: () => undefined };
        render(0);
        return {
            play: () =>
                gsap.to(state, {
                    value: target,
                    duration: 1.6,
                    ease: 'power2.out',
                    onUpdate: () => render(state.value),
                    onComplete: () => node && (node.nodeValue = original),
                }),
        };
    }

    function scrollProgress() {
        const bar = one('[data-scroll-progress]');
        if (!bar) return;
        gsap.fromTo(
            bar,
            { scaleX: 0, transformOrigin: '0% 50%' },
            { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 } },
        );
    }

    function pointerEffects() {
        const controller = new AbortController();
        const { signal } = controller;

        const hero = one('#hero');
        const img = one('[data-hero-img]');
        if (hero && img) {
            gsap.set(img, { scale: 1.06 });
            const moveX = gsap.quickTo(img, 'x', { duration: 0.8, ease: 'power3' });
            const moveY = gsap.quickTo(img, 'y', { duration: 0.8, ease: 'power3' });
            hero.addEventListener('pointermove', (event: PointerEvent) => {
                const rect = hero.getBoundingClientRect();
                moveX(((event.clientX - rect.left) / rect.width - 0.5) * -28);
                moveY(((event.clientY - rect.top) / rect.height - 0.5) * -18);
            }, { signal });
            hero.addEventListener('pointerleave', () => { moveX(0); moveY(0); }, { signal });
        }

        all('.track-card').forEach(card => {
            card.addEventListener('pointermove', (event: PointerEvent) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
                card.style.setProperty('--my', `${event.clientY - rect.top}px`);
            }, { signal });
        });

        all('[data-magnetic]').forEach(el => {
            const moveX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
            const moveY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
            el.addEventListener('pointermove', (event: PointerEvent) => {
                const rect = el.getBoundingClientRect();
                moveX((event.clientX - (rect.left + rect.width / 2)) * 0.3);
                moveY((event.clientY - (rect.top + rect.height / 2)) * 0.3);
            }, { signal });
            el.addEventListener('pointerleave', () => { moveX(0); moveY(0); }, { signal });
        });

        return () => controller.abort();
    }

    return {
        swapMethodology(change) {
            const img = one('[data-methodology-img]');
            if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches) {
                change();
                return;
            }
            gsap.killTweensOf(img);
            gsap.to(img, {
                opacity: 0,
                y: 10,
                duration: 0.18,
                ease: 'power1.in',
                onComplete: () => {
                    change();
                    requestAnimationFrame(() => gsap.to(img, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' }));
                },
            });
        },
        destroy() {
            window.removeEventListener('load', refresh);
            mm.revert();
        },
    };
}
