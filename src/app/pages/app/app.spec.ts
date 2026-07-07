import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { App } from './app';
import { UserService } from '../../services/user';
import { AdsenseService } from '../../services/adsense/adsense';
import { signal } from '@angular/core';

describe('App Layout Integration', () => {
    let component: App;
    let fixture: ComponentFixture<App>;
    let userServiceMock: any;
    let adsenseServiceMock: any;

    beforeEach(async () => {
        userServiceMock = {
            currentUser: signal<any>({ id: 'user-123', isPro: false }),
        };

        adsenseServiceMock = {
            adClient: 'ca-pub-1234567890123456',
            pushAdBlock: jasmine.createSpy('pushAdBlock'),
        };

        await TestBed.configureTestingModule({
            imports: [App, RouterTestingModule],
            providers: [
                { provide: UserService, useValue: userServiceMock },
                { provide: AdsenseService, useValue: adsenseServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(App);
        component = fixture.componentInstance;
    });

    it('should create App component and render headers/footers', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should render header and footer ad banners for Free users', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: false });
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        
        // InternalHeader has an app-ad-banner
        const headerAd = compiled.querySelector('app-internal-header app-ad-banner .ad-wrapper');
        expect(headerAd).toBeTruthy();

        // App (layout rodapé) has an app-ad-banner
        const footerAd = compiled.querySelector('main > div + div app-ad-banner .ad-wrapper');
        expect(footerAd).toBeTruthy();
    });

    it('should NOT render header and footer ad banners for Pro users', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: true });
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        
        const headerAd = compiled.querySelector('app-internal-header app-ad-banner .ad-wrapper');
        expect(headerAd).toBeNull();

        const footerAd = compiled.querySelector('main > div + div app-ad-banner .ad-wrapper');
        expect(footerAd).toBeNull();
    });
});
