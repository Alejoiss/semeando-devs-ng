import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AchievementModalComponent } from './achievement-modal';
import { AchievementsService } from '../../services/achievements';

describe('AchievementModalComponent', () => {
    let fixture: ComponentFixture<AchievementModalComponent>;
    let unseen: WritableSignal<any>;
    let achievements: { unseenAchievement: WritableSignal<any>; markAsViewed: jasmine.Spy };
    let navigate: jasmine.Spy;

    const unseenData = {
        achievement_id: 'ach-1',
        achievement: { id: 'ach-1', name: 'Aprendiz de Tags', requirement: 'Conclua o módulo de HTML', icon: 'tags.png' },
    };

    const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const button = (label: string) => buttons().find(b => b.textContent!.includes(label))!;
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

    beforeEach(() => {
        unseen = signal<any>(null);
        achievements = { unseenAchievement: unseen, markAsViewed: jasmine.createSpy('markAsViewed').and.resolveTo() };
        TestBed.configureTestingModule({
            providers: [provideRouter([]), { provide: AchievementsService, useValue: achievements }],
        });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
        fixture = TestBed.createComponent(AchievementModalComponent);
        fixture.detectChanges();
    });

    it('renders nothing when there is no unseen achievement', () => {
        expect(fixture.nativeElement.querySelector('button')).toBeNull();
        expect(text().trim()).toBe('');
    });

    it('shows the name and requirement of the unseen achievement', () => {
        unseen.set(unseenData);
        fixture.detectChanges();

        expect(text()).toContain('Aprendiz de Tags');
        expect(text()).toContain('Conclua o módulo de HTML');
    });

    it('marks it as viewed when closing, without navigating', () => {
        unseen.set(unseenData);
        fixture.detectChanges();

        button('Fechar').click();

        expect(achievements.markAsViewed).toHaveBeenCalledOnceWith('ach-1');
        expect(navigate).not.toHaveBeenCalled();
    });

    it('closes when clicking the backdrop', () => {
        unseen.set(unseenData);
        fixture.detectChanges();

        (fixture.nativeElement.querySelector('.backdrop-blur-xl') as HTMLElement).click();

        expect(achievements.markAsViewed).toHaveBeenCalledOnceWith('ach-1');
    });

    it('marks it as viewed and opens the achievements page', () => {
        unseen.set(unseenData);
        fixture.detectChanges();

        button('Mostrar minhas conquistas').click();

        expect(achievements.markAsViewed).toHaveBeenCalledOnceWith('ach-1');
        expect(navigate).toHaveBeenCalledOnceWith(['/app/conquistas']);
    });

    it('disappears once the service clears the unseen achievement', () => {
        unseen.set(unseenData);
        fixture.detectChanges();
        unseen.set(null);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('button')).toBeNull();
    });
});
