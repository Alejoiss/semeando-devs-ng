export type Gsap = typeof import('gsap').gsap;

const BRAND_COLORS = ['#bbe85d', '#985de8', '#42bdff', '#4551be', '#e85d96', '#3cb68c', '#ffcf00'];

export function prefersReducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function loadGsap(): Promise<Gsap> {
    return (await import('gsap')).gsap;
}

export function burstConfetti(gsap: Gsap, host: HTMLElement, count = 32): void {
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:50';
    host.appendChild(layer);

    const pieces = Array.from({ length: count }, (_, i) => {
        const piece = document.createElement('span');
        const size = gsap.utils.random(6, 11, 1);
        piece.style.cssText = `position:absolute;left:50%;top:38%;width:${size}px;height:${Math.round(size * 0.5)}px;border-radius:2px;background:${BRAND_COLORS[i % BRAND_COLORS.length]}`;
        layer.appendChild(piece);
        return piece;
    });

    const tl = gsap.timeline({ onComplete: () => layer.remove() });
    pieces.forEach(piece => {
        const x = gsap.utils.random(-260, 260);
        const peak = gsap.utils.random(-240, -90);
        const rotation = gsap.utils.random(-540, 540);
        tl.to(piece, { x, y: peak, rotation, duration: 0.6, ease: 'power2.out' }, 0)
            .to(piece, { y: peak + 420, opacity: 0, duration: 1.1, ease: 'power1.in' }, 0.6);
    });
}
