import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfessorTerms } from './professor-terms';
import { UserService } from '../../../../services/user';
import { signal } from '@angular/core';

describe('ProfessorTerms', () => {
    let component: ProfessorTerms;
    let fixture: ComponentFixture<ProfessorTerms>;
    let mockUserService: jasmine.SpyObj<UserService>;
    let currentUserSignal: any;

    beforeEach(async () => {
        currentUserSignal = signal({
            id: 'prof_123',
            name: 'Test Professor',
            email: 'professor@semeando.com',
            role: 'teacher',
            teacherTermsAccepted: false
        });

        mockUserService = jasmine.createSpyObj('UserService', ['acceptTeacherTerms']);
        // Mock the readonly computed currentUser property by mapping it to a signal
        (mockUserService as any).currentUser = currentUserSignal;

        await TestBed.configureTestingModule({
            imports: [ProfessorTerms],
            providers: [
                { provide: UserService, useValue: mockUserService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfessorTerms);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and render all 13 sections', () => {
        expect(component).toBeTruthy();
        const compiled = fixture.nativeElement as HTMLElement;
        
        // Let's verify that the title is present
        expect(compiled.querySelector('h1')?.textContent).toContain('Termos do');
        expect(compiled.querySelector('h1')?.textContent).toContain('Professor Parceiro');
        
        // Let's verify that we have section elements
        const sections = compiled.querySelectorAll('section');
        expect(sections.length).toBe(13);
    });

    it('should render navigation index with 13 items', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const indexItems = compiled.querySelectorAll('.grid button');
        // The index buttons have (click) calling scrollToSection
        expect(indexItems.length).toBe(13);
    });

    it('should call scrollToSection when clicking index item', () => {
        spyOn(component, 'scrollToSection');
        const compiled = fixture.nativeElement as HTMLElement;
        const firstIndexBtn = compiled.querySelector('.grid button') as HTMLButtonElement;
        
        expect(firstIndexBtn).toBeTruthy();
        firstIndexBtn.click();
        
        expect(component.scrollToSection).toHaveBeenCalledWith('pt-sec-1');
    });

    it('should invoke acceptTeacherTerms on accept button click and set accepting state', fakeAsync(() => {
        mockUserService.acceptTeacherTerms.and.returnValue(Promise.resolve());
        
        const compiled = fixture.nativeElement as HTMLElement;
        const acceptBtn = compiled.querySelector('#professor-terms-accept-btn') as HTMLButtonElement;
        expect(acceptBtn).toBeTruthy();
        
        acceptBtn.click();
        fixture.detectChanges();
        
        expect(component['isAccepting']()).toBeTrue();
        expect(mockUserService.acceptTeacherTerms).toHaveBeenCalled();
        
        tick();
        fixture.detectChanges();
        
        expect(component['isAccepting']()).toBeFalse();
        expect(component['errorMessage']()).toBeNull();
    }));

    it('should show error message when acceptTeacherTerms fails', fakeAsync(() => {
        mockUserService.acceptTeacherTerms.and.returnValue(Promise.reject(new Error('Erro de persistência')));
        
        const compiled = fixture.nativeElement as HTMLElement;
        const acceptBtn = compiled.querySelector('#professor-terms-accept-btn') as HTMLButtonElement;
        expect(acceptBtn).toBeTruthy();
        
        acceptBtn.click();
        fixture.detectChanges();
        
        expect(component['isAccepting']()).toBeTrue();
        
        tick();
        fixture.detectChanges();
        
        expect(component['isAccepting']()).toBeFalse();
        expect(component['errorMessage']()).toBe('Erro de persistência');
        
        // Check if the error alert is rendered
        const errorAlert = compiled.querySelector('[role="alert"]');
        expect(errorAlert?.textContent).toContain('Erro de persistência');
    }));
});
