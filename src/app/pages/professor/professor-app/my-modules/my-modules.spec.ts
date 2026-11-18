import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyModules } from './my-modules';
import { ModuleService } from '../../../../services/module';
import { UserService } from '../../../../services/user';

describe('MyModules', () => {
    let fixture: ComponentFixture<MyModules>;
    let component: any;
    let currentUser: WritableSignal<any>;
    let moduleService: jasmine.SpyObj<ModuleService>;

    const mod = (id: string, over: object = {}) => ({ id, title: `Módulo ${id}`, description: `Desc ${id}`, icon: null, inRevision: false, ...over });
    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const toggles = () => Array.from(fixture.nativeElement.querySelectorAll('button[role="switch"]')) as HTMLButtonElement[];

    async function setup() {
        fixture = TestBed.createComponent(MyModules);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(() => {
        currentUser = signal({ id: 't1', role: 'teacher' });
        moduleService = jasmine.createSpyObj('ModuleService', ['getTeacherModules', 'checkAllLessonsValidated', 'updateModuleAvailability']);
        moduleService.getTeacherModules.and.resolveTo([mod('a'), mod('b', { inRevision: true })] as any);
        moduleService.checkAllLessonsValidated.and.resolveTo(true);
        moduleService.updateModuleAvailability.and.resolveTo();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: UserService, useValue: { currentUser } },
                { provide: ModuleService, useValue: moduleService },
            ],
        });
    });

    describe('listing', () => {
        it('lists the modules of the logged teacher', async () => {
            await setup();

            expect(moduleService.getTeacherModules).toHaveBeenCalledWith('t1');
            expect(text()).toContain('Módulo a');
            expect(text()).toContain('Módulo b');
        });

        it('links each module to its edit page with an accessible name', async () => {
            await setup();

            const edit = fixture.nativeElement.querySelector('a[aria-label="Editar módulo Módulo a"]') as HTMLAnchorElement;
            expect(edit.getAttribute('href')).toBe('/professor/editar-modulo/a');
        });

        it('shows an error when nobody is logged in', async () => {
            currentUser.set(null);
            await setup();

            expect(text()).toContain('Usuário não autenticado.');
            expect(moduleService.getTeacherModules).not.toHaveBeenCalled();
        });

        it('shows the error when loading fails, with a default message', async () => {
            moduleService.getTeacherModules.and.rejectWith(new Error('falhou'));
            await setup();
            expect(text()).toContain('falhou');
        });

        it('falls back to a default load error message', async () => {
            moduleService.getTeacherModules.and.rejectWith({});
            await setup();
            expect(text()).toContain('Erro ao carregar seus módulos.');
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

            it('makes a module available after checking that all lessons are validated', async () => {
                await setup();

                await component.toggleAvailability(component.modules()[1], true);

                expect(moduleService.checkAllLessonsValidated).toHaveBeenCalledWith('b');
                expect(moduleService.updateModuleAvailability).toHaveBeenCalledWith('b', true);
                expect(component.modules()[1].inRevision).toBeFalse();
            });

            it('refuses to publish a module with unvalidated lessons', async () => {
                moduleService.checkAllLessonsValidated.and.resolveTo(false);
                await setup();

                await component.toggleAvailability(component.modules()[1], true);
                fixture.detectChanges();

                expect(moduleService.updateModuleAvailability).not.toHaveBeenCalled();
                expect(component.modules()[1].inRevision).toBeTrue();
                expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
                    'O módulo "Módulo b" possui lições não validadas',
                );
            });

            it('puts a module back in revision without validating lessons', async () => {
                await setup();

                await component.toggleAvailability(component.modules()[0], false);

                expect(moduleService.checkAllLessonsValidated).not.toHaveBeenCalled();
                expect(moduleService.updateModuleAvailability).toHaveBeenCalledWith('a', false);
                expect(component.modules()[0].inRevision).toBeTrue();
            });

            it('shows the error and keeps the module as it was when the update fails', async () => {
                moduleService.updateModuleAvailability.and.rejectWith(new Error('sem permissão'));
                await setup();

                await component.toggleAvailability(component.modules()[0], false);

                expect(component.toggleError()).toBe('sem permissão');
                expect(component.modules()[0].inRevision).toBeFalse();
                expect(component.togglingModuleId()).toBeNull();
            });

            it('falls back to a default toggle error', async () => {
                moduleService.updateModuleAvailability.and.rejectWith({});
                await setup();
                await component.toggleAvailability(component.modules()[0], false);
                expect(component.toggleError()).toBe('Erro ao alterar disponibilidade do módulo.');
            });

            it('ignores a second toggle while one is in progress', async () => {
                await setup();
                component.togglingModuleId.set('a');

                await component.toggleAvailability(component.modules()[1], true);

                expect(moduleService.updateModuleAvailability).not.toHaveBeenCalled();
            });

            it('lets the admin dismiss the alert', async () => {
                moduleService.checkAllLessonsValidated.and.resolveTo(false);
                await setup();
                await component.toggleAvailability(component.modules()[1], true);
                fixture.detectChanges();

                (fixture.nativeElement.querySelector('button[aria-label="Fechar alerta"]') as HTMLButtonElement).click();
                fixture.detectChanges();

                expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
            });
        });
    });
});
