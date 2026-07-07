import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { AdsenseService } from './adsense';
import { UserService } from '../user';
import { signal } from '@angular/core';

describe('AdsenseService', () => {
    let service: AdsenseService;
    let userServiceMock: any;
    let routerEventsSubject: Subject<Event>;
    let routerMock: any;

    beforeEach(() => {
        // Remove scripts previously injected in DOM to ensure clean tests
        const existingScripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]');
        existingScripts.forEach(el => el.remove());

        userServiceMock = {
            currentUser: signal<any>(null),
        };

        routerEventsSubject = new Subject<Event>();
        routerMock = {
            url: '/app',
            events: routerEventsSubject.asObservable(),
        };

        TestBed.configureTestingModule({
            providers: [
                AdsenseService,
                { provide: UserService, useValue: userServiceMock },
                { provide: Router, useValue: routerMock },
            ],
        });
    });

    it('should be created', () => {
        service = TestBed.inject(AdsenseService);
        expect(service).toBeTruthy();
    });

    it('should inject AdSense script tag for free users in /app route', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        routerMock.url = '/app/modulo-1';
        
        service = TestBed.inject(AdsenseService);
        
        // Simulates route change ending
        routerEventsSubject.next(new NavigationEnd(1, '/app/modulo-1', '/app/modulo-1'));
        
        // Wait for effect to run
        TestBed.flushEffects();

        const script = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
        expect(script).toBeTruthy();
        expect(script?.getAttribute('src')).toContain('client=ca-pub-1234567890123456');
    });

    it('should not inject AdSense script tag for Pro users in /app route', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: true });
        routerMock.url = '/app/modulo-1';
        
        service = TestBed.inject(AdsenseService);
        
        routerEventsSubject.next(new NavigationEnd(1, '/app/modulo-1', '/app/modulo-1'));
        TestBed.flushEffects();

        const script = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
        expect(script).toBeNull();
    });

    it('should not inject AdSense script tag outside /app route even for free users', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        routerMock.url = '/home';
        
        service = TestBed.inject(AdsenseService);
        
        routerEventsSubject.next(new NavigationEnd(1, '/home', '/home'));
        TestBed.flushEffects();

        const script = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
        expect(script).toBeNull();
    });
});
