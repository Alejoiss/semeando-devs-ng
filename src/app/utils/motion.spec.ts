import { burstConfetti, Gsap, loadGsap, prefersReducedMotion } from './motion';

describe('motion utils', () => {
    describe('prefersReducedMotion', () => {
        it('reflects the media query result', () => {
            const spy = spyOn(window, 'matchMedia');
            spy.and.returnValue({ matches: true } as MediaQueryList);
            expect(prefersReducedMotion()).toBeTrue();
            expect(spy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');

            spy.and.returnValue({ matches: false } as MediaQueryList);
            expect(prefersReducedMotion()).toBeFalse();
        });
    });

    describe('loadGsap', () => {
        it('lazy loads the gsap instance', async () => {
            const gsap = await loadGsap();
            expect(typeof gsap.to).toBe('function');
        });
    });

    describe('burstConfetti', () => {
        let host: HTMLElement;
        let onComplete: () => void;

        function fakeGsap(): Gsap {
            const tl: any = {
                to: () => tl,
            };
            return {
                utils: { random: (min: number) => min },
                timeline: (vars: { onComplete: () => void }) => {
                    onComplete = vars.onComplete;
                    return tl;
                },
            } as unknown as Gsap;
        }

        beforeEach(() => {
            host = document.createElement('div');
        });

        it('adds a decorative layer with one piece per requested count', () => {
            burstConfetti(fakeGsap(), host, 5);

            const layer = host.firstElementChild as HTMLElement;
            expect(layer.getAttribute('aria-hidden')).toBe('true');
            expect(layer.children.length).toBe(5);
        });

        it('uses 32 pieces by default and cycles the brand colors', () => {
            burstConfetti(fakeGsap(), host);

            const pieces = Array.from(host.firstElementChild!.children) as HTMLElement[];
            expect(pieces.length).toBe(32);
            expect(pieces[0].style.background).toBe(pieces[7].style.background);
            expect(pieces[0].style.background).not.toBe(pieces[1].style.background);
        });

        it('removes the layer when the animation completes', () => {
            burstConfetti(fakeGsap(), host, 3);
            expect(host.children.length).toBe(1);

            onComplete();

            expect(host.children.length).toBe(0);
        });
    });
});
