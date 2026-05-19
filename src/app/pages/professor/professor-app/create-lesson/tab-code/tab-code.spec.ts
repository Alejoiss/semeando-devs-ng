import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabCode } from './tab-code';
import { LessonService } from '../../../../../services/lesson';
import { signal } from '@angular/core';
import { LessonType } from '../../../../../../models/lesson/lesson';

describe('TabCode', () => {
    let component: TabCode;
    let fixture: ComponentFixture<TabCode>;
    let mockLessonService: any;

    beforeEach(async () => {
        mockLessonService = {
            getLessonById: jasmine.createSpy('getLessonById').and.returnValue(Promise.resolve({
                id: 'l1',
                title: 'Challenge Title',
                description: 'Challenge description text...',
                type: LessonType.CHALLENGE,
                order: 1,
                subModuleId: 'sm1',
                xp: 100,
                language: 'TypeScript',
                initialCode: 'console.log("hello");'
            })),
            updateLesson: jasmine.createSpy('updateLesson').and.returnValue(Promise.resolve({}))
        };

        await TestBed.configureTestingModule({
            imports: [TabCode],
            providers: [
                { provide: LessonService, useValue: mockLessonService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TabCode);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should load lesson and populate language and code model on initialization', async () => {
        (component as any).lessonId = signal('l1');
        fixture.detectChanges();
        await fixture.whenStable();

        expect(mockLessonService.getLessonById).toHaveBeenCalledWith('l1');
        expect(component.codeForm.get('language')?.value).toBe('typescript');
        expect(component.codeModel.language).toBe('typescript');
        expect(component.codeModel.value).toBe('console.log("hello");');
    });

    it('should automatically lowercase language input and update codeModel language', () => {
        fixture.detectChanges();
        component.codeForm.get('language')?.setValue('PYTHON');
        expect(component.codeForm.get('language')?.value).toBe('python');
        expect(component.codeModel.language).toBe('python');
    });

    it('should save code and language when calling saveCode', async () => {
        (component as any).lessonId = signal('l1');
        fixture.detectChanges();
        await fixture.whenStable();

        component.codeForm.get('language')?.setValue('javascript');
        component.onCodeChanged('const a = 10;');
        await component.saveCode();

        expect(mockLessonService.updateLesson).toHaveBeenCalledWith('l1', {
            language: 'javascript',
            initialCode: 'const a = 10;'
        });
        expect(component.showSuccess()).toBeTrue();
    });
});
