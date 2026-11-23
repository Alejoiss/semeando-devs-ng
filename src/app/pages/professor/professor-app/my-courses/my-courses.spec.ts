import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyCourses } from './my-courses';
import { CourseService } from '../../../../services/course';
import { UserService } from '../../../../services/user';

describe('MyCourses', () => {
    let fixture: ComponentFixture<MyCourses>;
    let component: any;
    let currentUser: WritableSignal<any>;
    let courseService: jasmine.SpyObj<CourseService>;

    const mod = (id: string, over: object = {}) => ({ id, title: `Curso ${id}`, description: `Desc ${id}`, icon: null, inRevision: false, ...over });
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const toggles = () => Array.from(fixture.nativeElement.querySelectorAll('button[role="switch"]')) as HTMLButtonElement[];

    async function setup() {
        fixture = TestBed.createComponent(MyCourses);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(() => {
        currentUser = signal({ id: 't1', role: 'teacher' });
        courseService = jasmine.createSpyObj('CourseService', ['getTeacherCourses', 'checkAllLessonsValidated', 'updateCourseAvailability']);
        courseService.getTeacherCourses.and.resolveTo([mod('a'), mod('b', { inRevision: true })] as any);
        courseService.checkAllLessonsValidated.and.resolveTo(true);
        courseService.updateCourseAvailability.and.resolveTo();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: { currentUser } },
                { provide: CourseService, useValue: courseService },
            ],
        });
    });

    describe('listing', () => {
        it('lists the courses of the logged teacher', async () => {
            await setup();

            expect(courseService.getTeacherCourses).toHaveBeenCalledWith('t1');
            expect(text()).toContain('Curso a');
            expect(text()).toContain('Curso b');
        });

        it('links each course to its edit page with an accessible name', async () => {
            await setup();

            const edit = fixture.nativeElement.querySelector('a[aria-label="Editar curso Curso a"]') as HTMLAnchorElement;
            expect(edit.getAttribute('href')).toBe('/professor/editar-curso/a');
        });

        it('shows an error when nobody is logged in', async () => {
            currentUser.set(null);
            await setup();

            expect(text()).toContain('Usuário não autenticado.');
            expect(courseService.getTeacherCourses).not.toHaveBeenCalled();
        });

        it('shows the error when loading fails, with a default message', async () => {
            courseService.getTeacherCourses.and.rejectWith(new Error('falhou'));
            await setup();
            expect(text()).toContain('falhou');
        });

        it('falls back to a default load error message', async () => {
            courseService.getTeacherCourses.and.rejectWith({});
            await setup();
            expect(text()).toContain('Erro ao carregar seus cursos.');
        });
    });

    describe('availability switch', () => {
        it('is only offered to admins', async () => {
            await setup();
            expect(toggles().length).toBe(0);
        });

        describe('as admin', () => {
            beforeEach(() => currentUser.set({ id: 't1', role: 'admin' }));

            it('reflects availability (not in revision) in aria-checked', async () => {
                await setup();
                expect(toggles().map(t => t.getAttribute('aria-checked'))).toEqual(['true', 'false']);
            });

            it('makes a course available after checking that all lessons are validated', async () => {
                await setup();

                await component.toggleAvailability(component.courses()[1], true);

                expect(courseService.checkAllLessonsValidated).toHaveBeenCalledWith('b');
                expect(courseService.updateCourseAvailability).toHaveBeenCalledWith('b', true);
                expect(component.courses()[1].inRevision).toBeFalse();
            });

            it('refuses to publish a course with unvalidated lessons', async () => {
                courseService.checkAllLessonsValidated.and.resolveTo(false);
                await setup();

                await component.toggleAvailability(component.courses()[1], true);
                fixture.detectChanges();

                expect(courseService.updateCourseAvailability).not.toHaveBeenCalled();
                expect(component.courses()[1].inRevision).toBeTrue();
                expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
                    'O curso "Curso b" possui lições não validadas',
                );
            });

            it('puts a course back in revision without validating lessons', async () => {
                await setup();

                await component.toggleAvailability(component.courses()[0], false);

                expect(courseService.checkAllLessonsValidated).not.toHaveBeenCalled();
                expect(courseService.updateCourseAvailability).toHaveBeenCalledWith('a', false);
                expect(component.courses()[0].inRevision).toBeTrue();
            });

            it('shows the error and keeps the course as it was when the update fails', async () => {
                courseService.updateCourseAvailability.and.rejectWith(new Error('sem permissão'));
                await setup();

                await component.toggleAvailability(component.courses()[0], false);

                expect(component.toggleError()).toBe('sem permissão');
                expect(component.courses()[0].inRevision).toBeFalse();
                expect(component.togglingCourseId()).toBeNull();
            });

            it('falls back to a default toggle error', async () => {
                courseService.updateCourseAvailability.and.rejectWith({});
                await setup();
                await component.toggleAvailability(component.courses()[0], false);
                expect(component.toggleError()).toBe('Erro ao alterar disponibilidade do curso.');
            });

            it('ignores a second toggle while one is in progress', async () => {
                await setup();
                component.togglingCourseId.set('a');

                await component.toggleAvailability(component.courses()[1], true);

                expect(courseService.updateCourseAvailability).not.toHaveBeenCalled();
            });

            it('lets the admin dismiss the alert', async () => {
                courseService.checkAllLessonsValidated.and.resolveTo(false);
                await setup();
                await component.toggleAvailability(component.courses()[1], true);
                fixture.detectChanges();

                (fixture.nativeElement.querySelector('button[aria-label="Fechar alerta"]') as HTMLButtonElement).click();
                fixture.detectChanges();

                expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
            });
        });
    });
});
