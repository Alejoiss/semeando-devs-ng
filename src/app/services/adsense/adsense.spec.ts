import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { ADSENSE_CONFIG, AdsenseService } from './adsense';
import { UserService } from '../user';
import { signal } from '@angular/core';

describe('AdsenseService', () => {
    let service: AdsenseService;
    let userServiceMock: any;
    let routerEventsSubject: Subject<Event>;
    let routerMock: any;

    const setCurrentRouteData = (data: Record<string, unknown>) => {
        routerMock.routerState = {
            snapshot: { root: { data: {}, firstChild: { data: {}, firstChild: { data, firstChild: null } } } },
        };
    };

    const navigate = (url: string, data: Record<string, unknown>) => {
        setCurrentRouteData(data);
        routerEventsSubject.next(new NavigationEnd(1, url, url));
        TestBed.flushEffects();
    };

    const adScript = () => document.querySelector('script[src*="pagead2.googlesyndication.com"]');

    beforeEach(() => {
        document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]').forEach(el => el.remove());

        userServiceMock = {
            currentUser: signal<any>(null),
            isProfileResolved: signal<boolean>(true),
        };

        routerEventsSubject = new Subject<Event>();
        routerMock = {
            events: routerEventsSubject.asObservable(),
        };
        setCurrentRouteData({});

        TestBed.configureTestingModule({
            providers: [
                AdsenseService,
                { provide: UserService, useValue: userServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ADSENSE_CONFIG, useValue: { client: 'ca-pub-1234567890123456', footerSlot: '2222222222' } },
            ],
        });
    });

    it('should be created', () => {
        service = TestBed.inject(AdsenseService);
        expect(service).toBeTruthy();
    });

    it('should inject AdSense script tag for free users on routes that allow ads', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        service = TestBed.inject(AdsenseService);

        navigate('/app/s/modulo-1', { showAds: true });

        expect(service.shouldShowAds()).toBeTrue();
        expect(adScript()?.getAttribute('src')).toContain('client=ca-pub-1234567890123456');
    });

    it('should not inject AdSense script tag for Pro users', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: true });
        service = TestBed.inject(AdsenseService);

        navigate('/app/s/modulo-1', { showAds: true });

        expect(service.shouldShowAds()).toBeFalse();
        expect(adScript()).toBeNull();
    });

    it('should show ads to anonymous visitors on public content routes', () => {
        service = TestBed.inject(AdsenseService);

        navigate('/cursos/css/introducao-ao-css/o-que-e-css', { showAds: true });

        expect(service.shouldShowAds()).toBeTrue();
        expect(adScript()).not.toBeNull();
    });

    it('should wait for the user profile before showing ads', () => {
        userServiceMock.isProfileResolved.set(false);
        service = TestBed.inject(AdsenseService);

        navigate('/app/s/modulo-1', { showAds: true });
        expect(service.shouldShowAds()).toBeFalse();
        expect(adScript()).toBeNull();

        userServiceMock.currentUser.set({ id: 'user-123', isPro: true });
        userServiceMock.isProfileResolved.set(true);
        TestBed.flushEffects();
        expect(service.shouldShowAds()).toBeFalse();
        expect(adScript()).toBeNull();
    });

    it('should not show ads on app routes without content, such as checkout', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        service = TestBed.inject(AdsenseService);

        navigate('/app/checkout', {});

        expect(service.shouldShowAds()).toBeFalse();
        expect(adScript()).toBeNull();
    });

    it('should stop showing ads when navigating from a content route to a non-content route', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        service = TestBed.inject(AdsenseService);

        navigate('/app/s/modulo-1', { showAds: true });
        expect(service.shouldShowAds()).toBeTrue();

        navigate('/app/upgrade', {});
        expect(service.shouldShowAds()).toBeFalse();
    });

    it('should stay disabled when no AdSense client is configured', () => {
        TestBed.overrideProvider(ADSENSE_CONFIG, { useValue: {} });
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        service = TestBed.inject(AdsenseService);

        navigate('/app/s/modulo-1', { showAds: true });

        expect(service.isEnabled).toBeFalse();
        expect(adScript()).toBeNull();
    });
});
