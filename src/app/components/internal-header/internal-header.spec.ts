import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InternalHeader } from './internal-header';
import { NavigationService } from '../../services/navigation';
import { SeedService } from '../../services/seed';
import { UserService } from '../../services/user';
import { XpService } from '../../services/xp';

registerLocaleData(localePt);

describe('InternalHeader', () => {
    let fixture: ComponentFixture<InternalHeader>;
    let totalXp: WritableSignal<number>;
    let totalSeeds: WritableSignal<number>;
    let currentUser: WritableSignal<any>;
    let xpService: { totalXp: WritableSignal<number>; getXp: jasmine.Spy };
    let seedService: { totalSeeds: WritableSignal<number>; getSeeds: jasmine.Spy };

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const display = (c: any) => ({ xp: c.displayXp(), seeds: c.displaySeeds() });

    function setup({ xp = 0, seeds = 0, user = { isPro: false, avatar: '' } as any } = {}) {
        totalXp = signal(xp);
        totalSeeds = signal(seeds);
        currentUser = signal(user);
        xpService = { totalXp, getXp: jasmine.createSpy('getXp') };
        seedService = { totalSeeds, getSeeds: jasmine.createSpy('getSeeds') };
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: LOCALE_ID, useValue: 'pt-BR' },
                { provide: XpService, useValue: xpService },
                { provide: SeedService, useValue: seedService },
                { provide: UserService, useValue: { currentUser } },
            ],
        });
        fixture = TestBed.createComponent(InternalHeader);
        fixture.detectChanges();
    }

    it('loads xp and seeds when it starts', () => {
        setup();
        expect(xpService.getXp).toHaveBeenCalledTimes(1);
        expect(seedService.getSeeds).toHaveBeenCalledTimes(1);
    });

    it('shows the first loaded values right away, without animating from zero', () => {
        setup({ xp: 1500, seeds: 42 });

        expect(display(fixture.componentInstance)).toEqual({ xp: 1500, seeds: 42 });
        expect(text()).toContain('1.500');
        expect(text()).toContain('42');
    });

    it('starts at zero when there is nothing yet', () => {
        setup();
        expect(display(fixture.componentInstance)).toEqual({ xp: 0, seeds: 0 });
    });

    it('animates the counters up to the new value in about a second', fakeAsync(() => {
        setup({ xp: 100, seeds: 10 });
        const c: any = fixture.componentInstance;

        totalXp.set(200);
        totalSeeds.set(20);
        fixture.detectChanges();
        tick(500);
        expect(c.displayXp()).toBeGreaterThan(100);
        expect(c.displayXp()).toBeLessThan(200);
        expect(c.displaySeeds()).toBeGreaterThan(10);
        expect(c.displaySeeds()).toBeLessThan(20);

        tick(600);
        expect(display(c)).toEqual({ xp: 200, seeds: 20 });
        flush();
    }));

    it('pulses the xp pill when xp changes and stops pulsing afterwards', fakeAsync(() => {
        setup({ xp: 100 });
        const c: any = fixture.componentInstance;

        totalXp.set(150);
        fixture.detectChanges();
        tick(20);
        expect(c.isPulsing()).toBeTrue();

        tick(700);
        expect(c.isPulsing()).toBeFalse();
        flush();
    }));

    it('does not pulse when only seeds change', fakeAsync(() => {
        setup({ xp: 100, seeds: 5 });
        const c: any = fixture.componentInstance;

        totalSeeds.set(9);
        fixture.detectChanges();
        tick(50);

        expect(c.isPulsing()).toBeFalse();
        flush();
    }));

    it('restarts the animation from the current value when a new target arrives mid-way', fakeAsync(() => {
        setup({ xp: 100 });
        const c: any = fixture.componentInstance;

        totalXp.set(200);
        fixture.detectChanges();
        tick(300);
        totalXp.set(300);
        fixture.detectChanges();
        tick(1100);

        expect(c.displayXp()).toBe(300);
        flush();
    }));

    describe('user area', () => {
        it('shows the avatar when the user has one', () => {
            setup({ user: { isPro: false, avatar: 'me.png' } });
            expect(fixture.nativeElement.querySelector('a[href="/app/perfil"] img').getAttribute('src')).toBe('me.png');
        });

        it('shows a placeholder icon without avatar', () => {
            setup({ user: { isPro: false, avatar: '' } });
            const link = fixture.nativeElement.querySelector('a[href="/app/perfil"]') as HTMLElement;
            expect(link.querySelector('img')).toBeNull();
            expect(link.textContent).toContain('person');
        });

        it('marks pro users with a star badge', () => {
            setup({ user: { isPro: true, avatar: '' } });
            expect(fixture.nativeElement.querySelector('[data-icon="star"]')).toBeTruthy();
        });

        it('does not show the badge for free users', () => {
            setup();
            expect(fixture.nativeElement.querySelector('[data-icon="star"]')).toBeNull();
        });
    });

    it('links the logo to the app home', () => {
        setup();
        expect(fixture.nativeElement.querySelector('a.brand').getAttribute('href')).toBe('/app');
    });

    it('names the menu button for assistive technology', () => {
        setup();
        const button = fixture.nativeElement.querySelector('header button') as HTMLButtonElement;
        expect(button.getAttribute('aria-label')).toBe('Abrir menu lateral');
    });

    it('toggles the sidebar from the menu button', () => {
        setup();
        const navigation = TestBed.inject(NavigationService);

        (fixture.nativeElement.querySelector('header button') as HTMLButtonElement).click();
        expect(navigation.isSidebarOpen()).toBeTrue();

        (fixture.nativeElement.querySelector('header button') as HTMLButtonElement).click();
        expect(navigation.isSidebarOpen()).toBeFalse();
    });
});
