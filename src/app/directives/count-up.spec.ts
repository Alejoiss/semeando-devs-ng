import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountUp } from './count-up';

@Component({
    imports: [CountUp],
    template: `<span [appCountUp]="value()" prefix="+" suffix=" XP"></span>`,
})
class Host {
    readonly value = signal(0);
}

describe('CountUp', () => {
    it('renders prefix and suffix around the value and settles on the target', async () => {
        const fixture = TestBed.createComponent(Host);
        fixture.detectChanges();
        const span: HTMLElement = fixture.nativeElement.querySelector('span');
        expect(span.textContent).toBe('+0 XP');

        fixture.componentInstance.value.set(30);
        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, 1800));
        expect(span.textContent).toBe('+30 XP');
    });
});
