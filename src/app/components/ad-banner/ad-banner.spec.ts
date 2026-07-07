import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { AdBannerComponent } from './ad-banner';
import { AdsenseService } from '../../services/adsense/adsense';
import { UserService } from '../../services/user';
import { signal } from '@angular/core';

describe('AdBannerComponent', () => {
    let component: AdBannerComponent;
    let fixture: ComponentFixture<AdBannerComponent>;
    let adsenseServiceMock: any;
    let userServiceMock: any;

    beforeEach(async () => {
        adsenseServiceMock = {
            adClient: 'ca-pub-1234567890123456',
            pushAdBlock: jasmine.createSpy('pushAdBlock'),
        };

        userServiceMock = {
            currentUser: signal<any>({ id: 'user-123', isPro: false }),
        };

        await TestBed.configureTestingModule({
            imports: [AdBannerComponent],
            providers: [
                { provide: AdsenseService, useValue: adsenseServiceMock },
                { provide: UserService, useValue: userServiceMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdBannerComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should display the banner if the user is free', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.ad-wrapper')).toBeTruthy();
        expect(compiled.querySelector('ins.adsbygoogle')).toBeTruthy();
    });

    it('should not display the banner if the user is Pro', () => {
        userServiceMock.currentUser.set({ id: 'user-123', isPro: true });
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.ad-wrapper')).toBeNull();
    });

    it('should call pushAdBlock on AdsenseService after view init', fakeAsync(() => {
        fixture.detectChanges();
        tick(150); // wait for setTimeout in ngAfterViewInit
        expect(adsenseServiceMock.pushAdBlock).toHaveBeenCalled();
    }));

    it('should collapse the banner if detectAdFailure finds no iframe', fakeAsync(() => {
        fixture.detectChanges();
        tick(150); // run ngAfterViewInit
        
        // At this point, the template has no iframe inside ins.adsbygoogle
        tick(1500); // wait for detectAdFailure
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.ad-wrapper')).toBeNull(); // Should be destroyed due to shouldShowAd computed becoming false
    }));

    it('should bind inputs to ins element attributes correctly', () => {
        fixture.componentRef.setInput('adSlot', '9876543210');
        fixture.componentRef.setInput('adFormat', 'rectangle');
        fixture.componentRef.setInput('fullWidthResponsive', false);
        fixture.componentRef.setInput('adStyle', { display: 'inline-block', height: '100px' });
        
        fixture.detectChanges();

        const ins = fixture.nativeElement.querySelector('ins.adsbygoogle');
        expect(ins).toBeTruthy();
        expect(ins.getAttribute('data-ad-slot')).toBe('9876543210');
        expect(ins.getAttribute('data-ad-format')).toBe('rectangle');
        expect(ins.getAttribute('data-full-width-responsive')).toBe('false');
        expect(ins.style.display).toBe('inline-block');
        expect(ins.style.height).toBe('100px');
    });
});
