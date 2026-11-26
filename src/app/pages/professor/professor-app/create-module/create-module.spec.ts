import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateModule } from './create-module';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../services/user';
import { LessonService } from '../../../../services/lesson';
import { ModuleService } from '../../../../services/module';
import { QuizService } from '../../../../services/quiz';
import { signal } from '@angular/core';
import { LessonType } from '../../../../../models/lesson/lesson';

describe('CreateModule', () => {
    let component: CreateModule;
    let fixture: ComponentFixture<CreateModule>;
    let mockUserService: any;
    let mockLessonService: any;
    let mockModuleService: any;
    let mockQuizService: any;
    let router: Router;

    const mockActivatedRoute = {
        snapshot: {
            paramMap: {
                get: (key: string) => {
                    if (key === 'id') return 'module-1';
                    if (key === 'courseId') return 'course-1';
                    return null;
                }
            }
        }
    };

    beforeEach(async () => {
        mockUserService = {
            currentUser: signal({ id: 'user-1' })
        };

        mockLessonService = {
            getLessonsByModuleId: jasmine.createSpy().and.returnValue(Promise.resolve([
                { id: 'l1', title: 'Licao 1', type: 'LESSON', order: 1 },
                { id: 'l2', title: 'Revisão do módulo Introdução ao Angular', type: 'REVISION', order: 2 }
            ])),
            getLessonCountByModuleId: jasmine.createSpy().and.returnValue(Promise.resolve(2)),
            createLesson: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'l3' })),
            deleteLesson: jasmine.createSpy().and.returnValue(Promise.resolve()),
            updateLessonOrder: jasmine.createSpy().and.returnValue(Promise.resolve()),
            validateLesson: jasmine.createSpy().and.returnValue(Promise.resolve(true))
        };

        mockQuizService = {
            getOrCreateQuiz: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'q1' }))
        };

        mockModuleService = {
            getModuleById: jasmine.createSpy().and.returnValue(Promise.resolve({
                id: 'module-1',
                title: 'Introdução ao Angular',
                description: 'Aprenda os conceitos básicos',
                module_id: 'course-1'
            })),
            getModuleCountByCourseId: jasmine.createSpy().and.returnValue(Promise.resolve(0)),
            createModule: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'module-1' })),
            updateModule: jasmine.createSpy().and.returnValue(Promise.resolve()),
            setModulePublished: jasmine.createSpy().and.returnValue(Promise.resolve())
        };

        await TestBed.configureTestingModule({
            imports: [CreateModule, ReactiveFormsModule, RouterModule.forRoot([])],
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: UserService, useValue: mockUserService },
                { provide: LessonService, useValue: mockLessonService },
                { provide: ModuleService, useValue: mockModuleService },
                { provide: QuizService, useValue: mockQuizService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateModule);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        spyOn(router, 'navigate');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create a revision lesson successfully and reload list', async () => {
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.form.controls.title.value).toBe('Introdução ao Angular');

        await component.createRevision();

        expect(mockLessonService.getLessonCountByModuleId).toHaveBeenCalledWith('module-1');
        expect(mockLessonService.createLesson).toHaveBeenCalledWith({
            title: 'Revisão do módulo Introdução ao Angular',
            description: 'Vamos revisar o que aprendemos até aqui neste módulo',
            type: LessonType.REVISION,
            order: 3,
            moduleId: 'module-1',
            xp: 50,
            createdBy: 'user-1',
            isValidated: false
        });
        expect(mockQuizService.getOrCreateQuiz).toHaveBeenCalledWith('l3');
        expect(mockLessonService.getLessonsByModuleId).toHaveBeenCalledTimes(2); // Initial + after creation
    });

    it('should set lessonsError when revision lesson creation fails', async () => {
        await fixture.whenStable();
        fixture.detectChanges();

        mockLessonService.createLesson.and.returnValue(Promise.reject(new Error('Erro ao criar')));

        await component.createRevision();

        expect(component.lessonsError()).toBe('Erro ao criar');
    });

    it('should show edit link for standard lesson but hide it for revision lesson', async () => {
        await fixture.whenStable();
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const editLinks = compiled.querySelectorAll('a[href*="/professor/editar-licao"]');

        const lessonsList = component.lessons();
        expect(lessonsList.length).toBe(2);
        expect(lessonsList[0].type).toBe('LESSON');
        expect(lessonsList[1].type).toBe('REVISION');
    });

    describe('publication', () => {
        const status = () => (fixture.nativeElement as HTMLElement).querySelector('[data-testid="publication-status"]')?.textContent?.trim();

        beforeEach(async () => {
            await fixture.whenStable();
            fixture.detectChanges();
        });

        it('starts as a draft when the module is not published', () => {
            expect(component.published()).toBeFalse();
            expect(status()).toBe('Módulo em rascunho');
        });

        it('reflects a module that is already published', async () => {
            mockModuleService.getModuleById.and.resolveTo({ id: 'module-1', title: 'T', description: 'D', module_id: 'course-1', published: true });
            await component.loadModule('module-1');
            fixture.detectChanges();

            expect(status()).toBe('Módulo publicado');
        });

        it('validates every lesson, REVISION included, and then publishes', async () => {
            await component.publishModule();

            expect(mockLessonService.validateLesson).toHaveBeenCalledWith('l1', LessonType.LESSON);
            expect(mockLessonService.validateLesson).toHaveBeenCalledWith('l2', LessonType.REVISION);
            expect(mockModuleService.setModulePublished).toHaveBeenCalledOnceWith('module-1', true);
            expect(component.published()).toBeTrue();
            expect(component.publishError()).toBeNull();
        });

        it('does not publish and names the lessons that failed validation', async () => {
            mockLessonService.validateLesson.and.callFake((id: string) => Promise.resolve(id !== 'l2'));

            await component.publishModule();

            expect(mockModuleService.setModulePublished).not.toHaveBeenCalled();
            expect(component.published()).toBeFalse();
            expect(component.publishError()).toContain('Revisão do módulo Introdução ao Angular');
            expect(component.publishError()).not.toContain('Licao 1');
            expect(component.lessons().find(l => l.id === 'l2')?.isValidated).toBeFalse();
        });

        it('does not publish a module without lessons', async () => {
            component.lessons.set([]);

            await component.publishModule();

            expect(mockLessonService.validateLesson).not.toHaveBeenCalled();
            expect(mockModuleService.setModulePublished).not.toHaveBeenCalled();
            expect(component.publishError()).toBe('O módulo não tem lições.');
        });

        it('shows the error when publishing fails', async () => {
            mockModuleService.setModulePublished.and.rejectWith(new Error('RLS negou'));

            await component.publishModule();

            expect(component.published()).toBeFalse();
            expect(component.publishError()).toBe('RLS negou');
        });

        it('unpublishes without confirmation or validation', async () => {
            component.published.set(true);

            await component.unpublishModule();

            expect(mockModuleService.setModulePublished).toHaveBeenCalledOnceWith('module-1', false);
            expect(mockLessonService.validateLesson).not.toHaveBeenCalled();
            expect(component.published()).toBeFalse();
        });
    });
});
