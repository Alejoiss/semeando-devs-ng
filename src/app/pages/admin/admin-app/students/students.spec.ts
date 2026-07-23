import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminStudents } from './students';
import { AdminStudentService } from '../../../../services/admin-student';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt, 'pt-BR');

describe('AdminStudents', () => {
    let component: AdminStudents;
    let fixture: ComponentFixture<AdminStudents>;
    let mockService: any;

    const mockStudents = [
        { id: '1', name: 'Alice', email: 'alice@a.com', avatar: '', isPro: true, createdAt: new Date('2026-01-01') },
        { id: '2', name: 'Bob', email: 'bob@a.com', avatar: 'bob.jpg', isPro: false, createdAt: new Date('2026-02-01') }
    ];

    beforeEach(async () => {
        mockService = {
            getStudents: jasmine.createSpy('getStudents').and.returnValue(Promise.resolve({ students: mockStudents, total: 2 }))
        };

        await TestBed.configureTestingModule({
            imports: [AdminStudents],
            providers: [
                provideRouter([]),
                { provide: AdminStudentService, useValue: mockService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminStudents);
        component = fixture.componentInstance;
    });

    it('renders with at least one record (REQ-1.1)', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const cards = fixture.debugElement.queryAll(By.css('a'));
        expect(cards.length).toBe(2);
        expect(cards[0].nativeElement.textContent).toContain('Alice');
    }));

    it('default and configurable page sizes apply correctly (REQ-1.2, REQ-1.3)', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const select = fixture.debugElement.query(By.css('#student-page-size-select')).nativeElement;
        expect(select.value).toBe('10'); // Default

        select.value = '25';
        select.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        tick();

        expect(component.pageSize()).toBe(25);
        expect(mockService.getStudents).toHaveBeenCalledWith(jasmine.objectContaining({ pageSize: 25 }));
    }));

    it('page navigation controls show the correct page of records (REQ-1.4, REQ-1.5)', fakeAsync(() => {
        // Force total count high enough for multiple pages
        mockService.getStudents.and.returnValue(Promise.resolve({ students: mockStudents, total: 25 }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const nextBtn = fixture.debugElement.query(By.css('#student-next-page')).nativeElement;
        const prevBtn = fixture.debugElement.query(By.css('#student-prev-page')).nativeElement;

        expect(prevBtn.disabled).toBeTrue(); // Page 0
        expect(nextBtn.disabled).toBeFalse();

        nextBtn.click();
        fixture.detectChanges();
        tick();

        expect(component.currentPage()).toBe(1);
        expect(mockService.getStudents).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1 }));
    }));

    it('default sort is by name ascending (REQ-2.1)', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(mockService.getStudents).toHaveBeenCalledWith(jasmine.objectContaining({ sortField: 'name', sortDir: 'asc' }));
    }));

    it('changing sort order re-renders the list accordingly (REQ-2.2, REQ-2.3)', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        const sortSelect = fixture.debugElement.query(By.css('#student-sort-select')).nativeElement;
        sortSelect.value = 'created_at';
        sortSelect.dispatchEvent(new Event('change'));
        fixture.detectChanges();
        tick();

        expect(component.sortField()).toBe('created_at');
        expect(mockService.getStudents).toHaveBeenCalledWith(jasmine.objectContaining({ sortField: 'created_at', sortDir: 'desc' }));
    }));

    it('filter input narrows the list and resets to page one (REQ-3.1, REQ-3.2, REQ-3.3)', fakeAsync(() => {
        // Set page to 1 first
        component.currentPage.set(1);
        fixture.detectChanges();

        const input = fixture.debugElement.query(By.css('#student-search-input')).nativeElement;
        input.value = 'Alice';
        input.dispatchEvent(new Event('input'));
        
        // Debounce time is 300ms
        tick(300);
        fixture.detectChanges();
        
        // Allow loadStudents promise to resolve
        tick();
        
        expect(component.searchQuery()).toBe('Alice');
        expect(component.currentPage()).toBe(0); // Should reset to 0
        expect(mockService.getStudents).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'Alice', page: 0 }));
    }));

    it('clearing the filter restores the full list (REQ-3.4)', fakeAsync(() => {
        const input = fixture.debugElement.query(By.css('#student-search-input')).nativeElement;
        input.value = '';
        input.dispatchEvent(new Event('input'));
        
        tick(300);
        fixture.detectChanges();
        tick();
        
        expect(component.searchQuery()).toBe('');
        expect(mockService.getStudents).toHaveBeenCalledWith(jasmine.objectContaining({ search: '' }));
    }));

    it('all required student fields are displayed per card (REQ-4.1, 4.2, 4.3, 4.4)', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const cards = fixture.debugElement.queryAll(By.css('a'));
        const aliceCard = cards[0].nativeElement;
        const bobCard = cards[1].nativeElement;

        expect(aliceCard.textContent).toContain('Alice');
        expect(aliceCard.textContent).toContain('alice@a.com');
        expect(aliceCard.textContent).toContain('PRO');

        // Check fallback avatar for Alice
        expect(aliceCard.querySelector('span.material-symbols-outlined').textContent).toContain('person');

        // Check image avatar for Bob
        expect(bobCard.querySelector('img').src).toContain('bob.jpg');
    }));

    it('empty state message displays when no results found (REQ-1.1)', fakeAsync(() => {
        mockService.getStudents.and.returnValue(Promise.resolve({ students: [], total: 0 }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const content = fixture.debugElement.nativeElement.textContent;
        expect(content).toContain('Nenhum aluno encontrado');
    }));
});
