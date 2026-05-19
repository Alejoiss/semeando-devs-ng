import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateSubmodule } from './create-submodule';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../services/user';
import { LessonService } from '../../../../services/lesson';
import { SubModuleService } from '../../../../services/sub-module';
import { signal } from '@angular/core';
import { LessonType } from '../../../../../models/lesson/lesson';

describe('CreateSubmodule', () => {
    let component: CreateSubmodule;
    let fixture: ComponentFixture<CreateSubmodule>;
    let mockUserService: any;
    let mockLessonService: any;
    let mockSubModuleService: any;
    let router: Router;

    const mockActivatedRoute = {
        snapshot: {
            paramMap: {
                get: (key: string) => {
                    if (key === 'id') return 'submodule-1';
                    if (key === 'moduleId') return 'module-1';
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
            getLessonsBySubModuleId: jasmine.createSpy().and.returnValue(Promise.resolve([
                { id: 'l1', title: 'Licao 1', type: 'LESSON', order: 1 },
                { id: 'l2', title: 'Revisão do submódulo Introdução ao Angular', type: 'REVISION', order: 2 }
            ])),
            getLessonCountBySubModuleId: jasmine.createSpy().and.returnValue(Promise.resolve(2)),
            createLesson: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'l3' })),
            deleteLesson: jasmine.createSpy().and.returnValue(Promise.resolve()),
            updateLessonOrder: jasmine.createSpy().and.returnValue(Promise.resolve())
        };

        mockSubModuleService = {
            getSubModuleById: jasmine.createSpy().and.returnValue(Promise.resolve({
                id: 'submodule-1',
                title: 'Introdução ao Angular',
                description: 'Aprenda os conceitos básicos',
                module_id: 'module-1'
            })),
            getSubModuleCountByModuleId: jasmine.createSpy().and.returnValue(Promise.resolve(0)),
            createSubModule: jasmine.createSpy().and.returnValue(Promise.resolve({ id: 'submodule-1' })),
            updateSubModule: jasmine.createSpy().and.returnValue(Promise.resolve())
        };

        await TestBed.configureTestingModule({
            imports: [CreateSubmodule, ReactiveFormsModule, RouterModule.forRoot([])],
            providers: [
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: UserService, useValue: mockUserService },
                { provide: LessonService, useValue: mockLessonService },
                { provide: SubModuleService, useValue: mockSubModuleService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateSubmodule);
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

        expect(mockLessonService.getLessonCountBySubModuleId).toHaveBeenCalledWith('submodule-1');
        expect(mockLessonService.createLesson).toHaveBeenCalledWith({
            title: 'Revisão do submódulo Introdução ao Angular',
            description: 'Vamos revisar o que aprendemos até aqui neste submódulo',
            type: LessonType.REVISION,
            order: 3,
            subModuleId: 'submodule-1',
            xp: 50,
            createdBy: 'user-1'
        });
        expect(mockLessonService.getLessonsBySubModuleId).toHaveBeenCalledTimes(2); // Initial + after creation
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
});
