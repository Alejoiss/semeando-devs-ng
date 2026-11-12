import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotionReveal } from './motion-reveal';

@Component({
    standalone: true,
    imports: [MotionReveal],
    template: `
        <div appMotionReveal>
            <span data-motion="count">+{{ xp }} XP</span>
            <span data-motion="count">{{ score }}/5</span>
            <svg><circle cx="10" cy="10" r="8" stroke-dasharray="100" [attr.stroke-dashoffset]="offset"></circle></svg>
        </div>
    `,
})
class Host {
    xp = 25;
    score = 4;
    offset = 20;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('MotionReveal', () => {
    let fixture: ComponentFixture<Host>;
    let el: HTMLElement;

    beforeEach(() => {
        fixture = TestBed.createComponent(Host);
        el = fixture.nativeElement;
    });

    it('counts up and ends on the final text and ring offset', async () => {
        fixture.detectChanges();
        await wait(400);
        const [xp, score] = Array.from(el.querySelectorAll('[data-motion="count"]')).map(e => e.textContent);
        expect(xp).not.toBe('+25 XP');
        expect(score).toMatch(/^\d\/5$/);

        await wait(2200);
        const [finalXp, finalScore] = Array.from(el.querySelectorAll('[data-motion="count"]')).map(e => e.textContent);
        expect(finalXp).toBe('+25 XP');
        expect(finalScore).toBe('4/5');
        expect(parseFloat(el.querySelector('circle')!.style.strokeDashoffset)).toBeCloseTo(20, 0);
    });

    it('leaves the text untouched when reduced motion is preferred', async () => {
        spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
        fixture.detectChanges();
        await wait(300);
        expect(el.querySelector('[data-motion="count"]')!.textContent).toBe('+25 XP');
    });
});
