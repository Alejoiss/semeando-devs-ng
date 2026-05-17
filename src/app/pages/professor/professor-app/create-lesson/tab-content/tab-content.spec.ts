import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabContent } from './tab-content';
import { ReactiveFormsModule } from '@angular/forms';
import { SectionContentType } from '../../../../../../models/section-content/section-content';
import { LessonService } from '../../../../../services/lesson';
import { UserService } from '../../../../../services/user';
import { SectionContentService } from '../../../../../services/section-content';
import { signal } from '@angular/core';

describe('TabContent', () => {
    let component: TabContent;
    let fixture: ComponentFixture<TabContent>;
    let mockLessonService: any;
    let mockUserService: any;
    let mockSectionContentService: any;

    beforeEach(async () => {
        mockLessonService = {
            getLessonById: jasmine.createSpy().and.returnValue(Promise.resolve({ title: 'Test Lesson', description: 'Desc' })),
            updateLesson: jasmine.createSpy().and.returnValue(Promise.resolve()),
        };
        mockUserService = {
            currentUser: signal({ id: 'user-1' })
        };
        mockSectionContentService = {
            getSectionContentsByLessonId: jasmine.createSpy().and.returnValue(Promise.resolve([])),
            upsertSectionContents: jasmine.createSpy().and.returnValue(Promise.resolve()),
            deleteSectionContents: jasmine.createSpy().and.returnValue(Promise.resolve()),
            uploadLessonImage: jasmine.createSpy().and.returnValue(Promise.resolve('https://example.com/uploaded.png')),
        };

        await TestBed.configureTestingModule({
            imports: [TabContent, ReactiveFormsModule],
            providers: [
                { provide: LessonService, useValue: mockLessonService },
                { provide: UserService, useValue: mockUserService },
                { provide: SectionContentService, useValue: mockSectionContentService },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TabContent);
        component = fixture.componentInstance;
        // set dummy lessonId
        fixture.componentRef.setInput('lessonId', 'lesson-1');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('adds new content blocks', () => {
        expect(component.contentList().length).toBe(0);
        
        component.addContent(SectionContentType.MARKDOWN);
        expect(component.contentList().length).toBe(1);
        expect(component.contentList()[0].type).toBe(SectionContentType.MARKDOWN);

        component.addContent(SectionContentType.VIDEO);
        expect(component.contentList().length).toBe(2);
        expect(component.contentList()[1].type).toBe(SectionContentType.VIDEO);
        
        // Assert accordion expansion
        const addedId = component.contentList()[1].id!;
        expect(component.expandedContentIds().has(addedId)).toBeTrue();
    });

    it('manages and reorders blocks', () => {
        component.addContent(SectionContentType.IMAGE);
        component.addContent(SectionContentType.VIDEO);
        
        const firstId = component.contentList()[0].id!;
        const secondId = component.contentList()[1].id!;
        
        // Remove block
        component.removeContent(0);
        expect(component.contentList().length).toBe(1);
        expect(component.contentList()[0].id).toBe(secondId);
        
        // Toggle collapse
        expect(component.expandedContentIds().has(secondId)).toBeTrue();
        component.toggleContent(secondId);
        expect(component.expandedContentIds().has(secondId)).toBeFalse();
        
        // Reorder
        component.addContent(SectionContentType.MARKDOWN);
        expect(component.contentList()[0].type).toBe(SectionContentType.VIDEO);
        expect(component.contentList()[1].type).toBe(SectionContentType.MARKDOWN);
        
        // simulate drag drop event
        component.dropContent({ previousIndex: 0, currentIndex: 1 } as any);
        expect(component.contentList()[0].type).toBe(SectionContentType.MARKDOWN);
        expect(component.contentList()[1].type).toBe(SectionContentType.VIDEO);
    });

    it('updates content-specific inputs', () => {
        component.addContent(SectionContentType.MARKDOWN);
        component.updateContent(0, { content: '# Hello World' });
        expect(component.contentList()[0].content).toBe('# Hello World');
        
        component.addContent(SectionContentType.IMAGE);
        component.updateContent(1, { file: 'https://example.com/image.png', fileDescription: 'Desc' });
        expect(component.contentList()[1].file).toBe('https://example.com/image.png');
        expect(component.contentList()[1].fileDescription).toBe('Desc');
    });

    it('renders two-column layout and preview (structural check)', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const grid = compiled.querySelector('.grid-cols-1.lg\\:grid-cols-2');
        expect(grid).toBeTruthy();
        
        // verify preview pane is present when lessonId is set
        const previewHeader = Array.from(compiled.querySelectorAll('h3')).find(el => el.textContent?.includes('Preview da Lição'));
        expect(previewHeader).toBeTruthy();
    });
});
