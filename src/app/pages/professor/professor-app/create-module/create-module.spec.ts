import { signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { CreateModule } from './create-module';
import { ModuleService } from '../../../../services/module';
import { SubModuleService } from '../../../../services/sub-module';
import { SectionContentService } from '../../../../services/section-content';
import { UserService } from '../../../../services/user';
import { SectionContentType } from '../../../../../models/section-content/section-content';

describe('CreateModule', () => {
    let component: any;
    let moduleService: jasmine.SpyObj<ModuleService>;
    let subModuleService: jasmine.SpyObj<SubModuleService>;
    let sectionService: jasmine.SpyObj<SectionContentService>;
    let navigate: jasmine.Spy;
    let currentUser: ReturnType<typeof signal<any>>;

    const validForm = { title: 'HTML Essencial', description: 'Aprenda as tags principais do HTML' };

    const file = (bytes: number, name = 'a.png') => {
        const f = new File(['x'], name, { type: 'image/png' });
        Object.defineProperty(f, 'size', { value: bytes });
        return f;
    };
    const fileEvent = (f: File) => ({ target: { files: [f], value: 'x' } }) as unknown as Event;

    function create(id: string | null = null) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideMarkdown(),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? id : null) } } } },
                { provide: ModuleService, useValue: moduleService },
                { provide: SubModuleService, useValue: subModuleService },
                { provide: SectionContentService, useValue: sectionService },
                { provide: UserService, useValue: { currentUser } },
            ],
        });
        navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
        const fixture = TestBed.createComponent(CreateModule);
        component = fixture.componentInstance;
        fixture.detectChanges();
        return fixture;
    }

    beforeEach(() => {
        currentUser = signal({ id: 't1' });
        moduleService = jasmine.createSpyObj('ModuleService', ['getModuleById', 'uploadModuleAvatar', 'updateModule', 'createModule', 'assignTeacherToModule']);
        subModuleService = jasmine.createSpyObj('SubModuleService', ['getSubModulesByModuleId', 'deleteSubModule', 'updateSubModuleOrder']);
        sectionService = jasmine.createSpyObj('SectionContentService', [
            'getSectionContentsByModuleId', 'upsertSectionContentsForModule', 'deleteSectionContents', 'uploadLessonImage',
        ]);

        moduleService.getModuleById.and.resolveTo({ id: 'm1', title: 'HTML', description: 'Descrição longa do módulo', icon: null, avatar: 'html.png' } as any);
        moduleService.uploadModuleAvatar.and.resolveTo('https://cdn/avatar.png');
        moduleService.updateModule.and.resolveTo({} as any);
        moduleService.createModule.and.resolveTo({ id: 'new-id' } as any);
        moduleService.assignTeacherToModule.and.resolveTo();
        subModuleService.getSubModulesByModuleId.and.resolveTo([{ id: 's1', title: 'A' }, { id: 's2', title: 'B' }, { id: 's3', title: 'C' }] as any);
        subModuleService.deleteSubModule.and.resolveTo();
        subModuleService.updateSubModuleOrder.and.resolveTo();
        sectionService.getSectionContentsByModuleId.and.resolveTo([]);
        sectionService.upsertSectionContentsForModule.and.resolveTo();
        sectionService.deleteSectionContents.and.resolveTo();
        sectionService.uploadLessonImage.and.resolveTo('https://cdn/img.png');
        spyOn(window, 'alert');
    });

    describe('form and preview', () => {
        beforeEach(() => create());

        it('requires a title (2+ chars) and a description (10+ chars)', () => {
            expect(component.form.invalid).toBeTrue();
            component.form.patchValue({ title: 'H', description: 'curta' });
            expect(component.form.invalid).toBeTrue();
            component.form.patchValue(validForm);
            expect(component.form.valid).toBeTrue();
        });

        it('derives the slug from the title, without accents or symbols', () => {
            component.form.patchValue({ title: '  Introdução ao C# & .NET!  ' });
            expect(component.slug()).toBe('introducao-ao-c-net');
        });

        it('previews placeholders until something is typed', () => {
            expect(component.previewModule().title).toBe('Título do Módulo');
            component.form.patchValue(validForm);
            expect(component.previewModule()).toEqual(jasmine.objectContaining({ title: 'HTML Essencial', slug: 'html-essencial' }));
        });

        it('previews the icon in icon mode and the image in image mode', () => {
            component.avatarPreviewUrl.set('blob:x');
            component.iconName.set('code');

            expect(component.previewModule().avatar).toBe('blob:x');
            expect(component.previewModule().icon).toBeUndefined();

            component.setVisualMode('icon');
            expect(component.previewModule().icon).toBe('code');
            expect(component.previewModule().avatar).toBeUndefined();
        });

        it('reads the icon name from the input', () => {
            component.onIconNameChange({ target: { value: 'school' } } as unknown as Event);
            expect(component.iconName()).toBe('school');
        });
    });

    describe('module image', () => {
        beforeEach(() => {
            create();
            spyOn(URL, 'createObjectURL').and.returnValues('blob:1', 'blob:2');
            spyOn(URL, 'revokeObjectURL');
        });

        it('previews the chosen file', () => {
            const f = file(1000);
            component.onFileSelected(fileEvent(f));

            expect(component.selectedFile()).toBe(f);
            expect(component.avatarPreviewUrl()).toBe('blob:1');
        });

        it('releases the previous preview when another file is chosen', () => {
            component.onFileSelected(fileEvent(file(1000)));
            component.onFileSelected(fileEvent(file(2000)));

            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
            expect(component.avatarPreviewUrl()).toBe('blob:2');
        });

        it('rejects files over 2MB', () => {
            const event = fileEvent(file(2 * 1024 * 1024 + 1));
            component.onFileSelected(event);

            expect(window.alert).toHaveBeenCalledWith('A imagem não pode ter mais de 2MB.');
            expect(component.selectedFile()).toBeNull();
            expect((event.target as HTMLInputElement).value).toBe('');
        });

        it('accepts a file of exactly 2MB', () => {
            component.onFileSelected(fileEvent(file(2 * 1024 * 1024)));
            expect(component.selectedFile()).not.toBeNull();
        });

        it('ignores an empty selection', () => {
            component.onFileSelected({ target: { files: [] } } as unknown as Event);
            expect(component.selectedFile()).toBeNull();
        });
    });

    describe('creating a module', () => {
        beforeEach(() => {
            create();
            component.form.patchValue(validForm);
        });

        it('does not save an invalid form, marking the fields as touched', async () => {
            component.form.patchValue({ title: '' });
            await component.saveModule();

            expect(moduleService.createModule).not.toHaveBeenCalled();
            expect(component.form.controls.title.touched).toBeTrue();
        });

        it('needs a logged user', async () => {
            currentUser.set(null);
            await component.saveModule();

            expect(component.saveError()).toBe('Usuário não autenticado.');
            expect(moduleService.createModule).not.toHaveBeenCalled();
        });

        it('creates the module in revision, assigns the teacher and opens the edit page', async () => {
            component.avatarPreviewUrl.set('https://cdn/existing.png');

            await component.saveModule();

            expect(moduleService.createModule).toHaveBeenCalledWith({
                title: 'HTML Essencial',
                description: 'Aprenda as tags principais do HTML',
                slug: 'html-essencial',
                avatar: 'https://cdn/existing.png',
                icon: null,
                inRevision: true,
                createdBy: 't1',
            });
            expect(moduleService.assignTeacherToModule).toHaveBeenCalledWith('t1', 'new-id');
            expect(component.savedModuleId()).toBe('new-id');
            expect(navigate).toHaveBeenCalledWith(['/professor/editar-modulo', 'new-id']);
            expect(component.isSaving()).toBeFalse();
        });

        it('uploads the chosen image and uses its url', async () => {
            const f = file(1000);
            component.selectedFile.set(f);

            await component.saveModule();

            expect(moduleService.uploadModuleAvatar).toHaveBeenCalledWith(f);
            expect(moduleService.createModule.calls.mostRecent().args[0].avatar).toBe('https://cdn/avatar.png');
        });

        it('saves the icon and drops the image in icon mode', async () => {
            component.setVisualMode('icon');
            component.iconName.set('code');
            component.avatarPreviewUrl.set('https://cdn/old.png');

            await component.saveModule();

            const payload = moduleService.createModule.calls.mostRecent().args[0];
            expect(payload.icon).toBe('code');
            expect(payload.avatar).toBeNull();
            expect(moduleService.uploadModuleAvatar).not.toHaveBeenCalled();
        });

        it('saves the presentation contents with their order along with the new module', async () => {
            component.presentationContents.set([{ id: 'a', content: 'um' }, { id: 'b', content: 'dois' }]);

            await component.saveModule();

            expect(sectionService.upsertSectionContentsForModule).toHaveBeenCalledWith('new-id', [
                { id: 'a', content: 'um', order: 0 },
                { id: 'b', content: 'dois', order: 1 },
            ]);
        });

        it('deletes the contents removed before the first save', async () => {
            component.deletedPresentationContentIds.set(['x']);

            await component.saveModule();

            expect(sectionService.deleteSectionContents).toHaveBeenCalledWith(['x']);
            expect(component.deletedPresentationContentIds()).toEqual([]);
        });

        it('shows the error and stays on the page when saving fails', async () => {
            moduleService.createModule.and.rejectWith(new Error('slug em uso'));

            await component.saveModule();

            expect(component.saveError()).toBe('slug em uso');
            expect(navigate).not.toHaveBeenCalled();
            expect(component.isSaving()).toBeFalse();
        });

        it('uses a default error message', async () => {
            moduleService.createModule.and.rejectWith({});
            await component.saveModule();
            expect(component.saveError()).toBe('Erro ao salvar o módulo.');
        });

        it('ignores a second save while one is running', async () => {
            component.isSaving.set(true);
            await component.saveModule();
            expect(moduleService.createModule).not.toHaveBeenCalled();
        });
    });

    describe('editing a module', () => {
        it('loads the module into the form, in image mode when it has only an avatar', async () => {
            create('m1');
            await TestBed.inject(ModuleService).getModuleById('m1');
            await Promise.resolve();

            expect(component.form.getRawValue()).toEqual({ title: 'HTML', description: 'Descrição longa do módulo' });
            expect(component.savedModuleId()).toBe('m1');
            expect(component.visualMode()).toBe('image');
            expect(component.avatarPreviewUrl()).toBe('html.png');
        });

        it('prefers the icon when the module has one', async () => {
            moduleService.getModuleById.and.resolveTo({ id: 'm1', title: 'HTML', description: 'Descrição longa', icon: ' code ', avatar: 'html.png' } as any);
            create('m1');
            await new Promise(r => setTimeout(r));

            expect(component.visualMode()).toBe('icon');
            expect(component.iconName()).toBe('code');
            expect(component.avatarPreviewUrl()).toBe('html.png');
        });

        it('falls back to image mode when it has neither', async () => {
            moduleService.getModuleById.and.resolveTo({ id: 'm1', title: 'HTML', description: 'Descrição longa', icon: '  ', avatar: '' } as any);
            create('m1');
            await new Promise(r => setTimeout(r));

            expect(component.visualMode()).toBe('image');
            expect(component.avatarPreviewUrl()).toBeNull();
        });

        it('loads the presentation contents and expands the first one', async () => {
            sectionService.getSectionContentsByModuleId.and.resolveTo([{ id: 'c1' }, { id: 'c2' }] as any);
            create('m1');
            await new Promise(r => setTimeout(r));

            expect(component.presentationContents().length).toBe(2);
            expect([...component.expandedPresentationIds()]).toEqual(['c1']);
        });

        it('keeps working when the module cannot be loaded', async () => {
            spyOn(console, 'error');
            moduleService.getModuleById.and.rejectWith(new Error('x'));
            create('m1');
            await new Promise(r => setTimeout(r));

            expect(console.error).toHaveBeenCalled();
            expect(component.form.getRawValue().title).toBe('');
        });

        it('loads the submodules of the module', async () => {
            create('m1');
            await new Promise(r => setTimeout(r));

            expect(subModuleService.getSubModulesByModuleId).toHaveBeenCalledWith('m1');
            expect(component.subModules().map((s: any) => s.id)).toEqual(['s1', 's2', 's3']);
            expect(component.subModulesLoading()).toBeFalse();
        });

        it('shows an error when the submodules cannot be loaded', async () => {
            subModuleService.getSubModulesByModuleId.and.rejectWith(new Error('falhou'));
            create('m1');
            await new Promise(r => setTimeout(r));

            expect(component.subModulesError()).toBe('falhou');
        });

        it('updates the module and its contents instead of creating another', fakeAsync(() => {
            create('m1');
            tick();
            component.form.patchValue({ title: 'HTML Avançado' });
            component.deletedPresentationContentIds.set(['gone']);

            component.saveModule();
            tick();

            expect(moduleService.createModule).not.toHaveBeenCalled();
            expect(moduleService.updateModule).toHaveBeenCalledWith('m1', jasmine.objectContaining({ title: 'HTML Avançado', slug: 'html-avancado' }));
            expect(sectionService.upsertSectionContentsForModule).toHaveBeenCalledWith('m1', jasmine.any(Array));
            expect(sectionService.deleteSectionContents).toHaveBeenCalledWith(['gone']);
            expect(navigate).not.toHaveBeenCalled();
            expect(component.showSuccess()).toBeTrue();

            tick(3000);
            expect(component.showSuccess()).toBeFalse();
        }));

        it('shows the error when the update fails', async () => {
            create('m1');
            await new Promise(r => setTimeout(r));
            moduleService.updateModule.and.rejectWith(new Error('sem permissão'));

            await component.saveModule();

            expect(component.saveError()).toBe('sem permissão');
        });

        it('opens the submodule screens', async () => {
            create('m1');
            await new Promise(r => setTimeout(r));

            component.createSubModule();
            component.editSubModule('s2');

            expect(navigate).toHaveBeenCalledWith(['/professor/criar-submodulo', 'm1']);
            expect(navigate).toHaveBeenCalledWith(['/professor/editar-submodulo', 's2']);
        });

        it('only allows creating submodules after the module exists', () => {
            create();
            component.createSubModule();
            expect(navigate).not.toHaveBeenCalled();
        });
    });

    describe('deleting a submodule', () => {
        beforeEach(async () => {
            create('m1');
            await new Promise(r => setTimeout(r));
        });

        it('does nothing when the teacher does not confirm', async () => {
            spyOn(window, 'confirm').and.returnValue(false);
            await component.deleteSubModule('s1');
            expect(subModuleService.deleteSubModule).not.toHaveBeenCalled();
        });

        it('removes it from the list after confirming', async () => {
            spyOn(window, 'confirm').and.returnValue(true);
            await component.deleteSubModule('s1');

            expect(subModuleService.deleteSubModule).toHaveBeenCalledWith('s1');
            expect(component.subModules().map((s: any) => s.id)).toEqual(['s2', 's3']);
        });

        it('keeps it and warns when deleting fails', async () => {
            spyOn(window, 'confirm').and.returnValue(true);
            subModuleService.deleteSubModule.and.rejectWith(new Error('há lições'));

            await component.deleteSubModule('s1');

            expect(window.alert).toHaveBeenCalledWith('há lições');
            expect(component.subModules().length).toBe(3);
        });
    });

    describe('reordering submodules', () => {
        const ids = () => component.subModules().map((s: any) => s.id);

        beforeEach(async () => {
            create('m1');
            await new Promise(r => setTimeout(r));
        });

        it('moves the dragged item over the others', () => {
            component.onDragStart(0);
            component.onDragOver(new DragEvent('dragover'), 2);

            expect(ids()).toEqual(['s2', 's3', 's1']);
            expect(component.draggedIndex()).toBe(2);
        });

        it('ignores dragging over itself or without a drag', () => {
            component.onDragOver(new DragEvent('dragover'), 1);
            expect(ids()).toEqual(['s1', 's2', 's3']);

            component.onDragStart(1);
            component.onDragOver(new DragEvent('dragover'), 1);
            expect(ids()).toEqual(['s1', 's2', 's3']);
        });

        it('saves the new order on drop', async () => {
            component.onDragStart(0);
            component.onDragOver(new DragEvent('dragover'), 1);

            await component.onDrop();

            expect(subModuleService.updateSubModuleOrder).toHaveBeenCalledWith([
                { id: 's2', order: 0 }, { id: 's1', order: 1 }, { id: 's3', order: 2 },
            ]);
            expect(component.draggedIndex()).toBeNull();
        });

        it('warns and reloads the previous order when saving fails', async () => {
            subModuleService.updateSubModuleOrder.and.rejectWith(new Error('x'));
            component.onDragStart(0);
            component.onDragOver(new DragEvent('dragover'), 2);
            subModuleService.getSubModulesByModuleId.calls.reset();

            await component.onDrop();
            await new Promise(r => setTimeout(r));

            expect(window.alert).toHaveBeenCalledWith('Erro ao reordenar submódulos. A ordem anterior foi restaurada.');
            expect(subModuleService.getSubModulesByModuleId).toHaveBeenCalledWith('m1');
            expect(ids()).toEqual(['s1', 's2', 's3']);
        });
    });

    describe('presentation contents', () => {
        beforeEach(() => create());

        it('adds an empty content already expanded', () => {
            component.addPresentationContent(SectionContentType.MARKDOWN);

            const [added] = component.presentationContents();
            expect(added).toEqual(jasmine.objectContaining({ type: SectionContentType.MARKDOWN, content: '', file: '', fileDescription: '' }));
            expect(component.expandedPresentationIds().has(added.id)).toBeTrue();
        });

        it('updates one content without touching the others', () => {
            component.presentationContents.set([{ id: 'a', content: 'um' }, { id: 'b', content: 'dois' }]);
            component.updatePresentationContent(1, { content: 'novo' });
            expect(component.presentationContents()).toEqual([{ id: 'a', content: 'um' }, { id: 'b', content: 'novo' }]);
        });

        it('removes a content and remembers its id to delete it on save', () => {
            component.presentationContents.set([{ id: 'a' }, { id: 'b' }]);
            component.removePresentationContent(0);

            expect(component.presentationContents()).toEqual([{ id: 'b' }]);
            expect(component.deletedPresentationContentIds()).toEqual(['a']);
        });

        it('toggles the expanded state', () => {
            component.togglePresentationContent('a');
            expect(component.expandedPresentationIds().has('a')).toBeTrue();
            component.togglePresentationContent('a');
            expect(component.expandedPresentationIds().has('a')).toBeFalse();
        });

        it('reorders by drag and drop', () => {
            component.presentationContents.set([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
            component.dropPresentationContent({ previousIndex: 0, currentIndex: 2 } as any);
            expect(component.presentationContents().map((c: any) => c.id)).toEqual(['b', 'c', 'a']);
        });

        it('wraps trusted html', () => {
            expect(component.getSafeHtml('<b>x</b>')).toBeTruthy();
        });

        describe('image upload', () => {
            beforeEach(() => component.presentationContents.set([{ id: 'a', type: SectionContentType.IMAGE, file: '' }]));

            it('uploads and stores the public url', async () => {
                const f = file(1000);
                await component.onPresentationImageSelected(0, fileEvent(f));

                expect(sectionService.uploadLessonImage).toHaveBeenCalledWith(f);
                expect(component.presentationContents()[0].file).toBe('https://cdn/img.png');
                expect(component.isUploadingImageMap()['a']).toBeFalse();
            });

            it('rejects files over 5MB', async () => {
                await component.onPresentationImageSelected(0, fileEvent(file(5 * 1024 * 1024 + 1)));

                expect(window.alert).toHaveBeenCalledWith('A imagem não pode ter mais de 5MB.');
                expect(sectionService.uploadLessonImage).not.toHaveBeenCalled();
            });

            it('warns and clears the input when the upload fails', async () => {
                sectionService.uploadLessonImage.and.rejectWith(new Error('bucket cheio'));
                const event = fileEvent(file(1000));

                await component.onPresentationImageSelected(0, event);

                expect(window.alert).toHaveBeenCalledWith('bucket cheio');
                expect((event.target as HTMLInputElement).value).toBe('');
                expect(component.presentationContents()[0].file).toBe('');
                expect(component.isUploadingImageMap()['a']).toBeFalse();
            });

            it('ignores an empty selection', async () => {
                await component.onPresentationImageSelected(0, { target: { files: [] } } as unknown as Event);
                expect(sectionService.uploadLessonImage).not.toHaveBeenCalled();
            });

            it('removes the image of a content', () => {
                component.updatePresentationContent(0, { file: 'x.png' });
                component.removePresentationImage(0);
                expect(component.presentationContents()[0].file).toBe('');
            });
        });
    });

    describe('saving only the presentation', () => {
        beforeEach(async () => {
            create('m1');
            await new Promise(r => setTimeout(r));
        });

        it('needs a saved module', async () => {
            component.savedModuleId.set(null);
            await component.savePresentation();
            expect(component.presentationSaveError()).toBe('Módulo não encontrado.');
            expect(sectionService.upsertSectionContentsForModule).not.toHaveBeenCalled();
        });

        it('saves, deletes removed contents and reloads the fresh state', async () => {
            component.presentationContents.set([{ id: 'a' }]);
            component.deletedPresentationContentIds.set(['gone']);
            sectionService.getSectionContentsByModuleId.and.resolveTo([{ id: 'a-db' }] as any);

            await component.savePresentation();

            expect(sectionService.upsertSectionContentsForModule).toHaveBeenCalledWith('m1', [{ id: 'a', order: 0 }]);
            expect(sectionService.deleteSectionContents).toHaveBeenCalledWith(['gone']);
            expect(component.presentationContents()).toEqual([{ id: 'a-db' }] as any);
            expect(component.showPresentationSuccess()).toBeTrue();
            expect(component.isSavingPresentation()).toBeFalse();
        });

        it('shows the error when saving fails', async () => {
            sectionService.upsertSectionContentsForModule.and.rejectWith(new Error('falhou'));
            await component.savePresentation();
            expect(component.presentationSaveError()).toBe('falhou');
            expect(component.showPresentationSuccess()).toBeFalse();
        });

        it('uses a default error message', async () => {
            sectionService.upsertSectionContentsForModule.and.rejectWith({});
            await component.savePresentation();
            expect(component.presentationSaveError()).toBe('Erro ao salvar a apresentação.');
        });

        it('ignores a second save while one is running', async () => {
            component.isSavingPresentation.set(true);
            await component.savePresentation();
            expect(sectionService.upsertSectionContentsForModule).not.toHaveBeenCalled();
        });
    });
});
