import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleService } from '../../../../services/module';
import { SubModuleService } from '../../../../services/sub-module';
import { UserService } from '../../../../services/user';
import { toSignal } from '@angular/core/rxjs-interop';
import { SubModule } from '../../../../../models/sub-module/sub-module';
import { SectionContentService } from '../../../../services/section-content';
import { SectionContent, SectionContentType } from '../../../../../models/section-content/section-content';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MarkdownModule } from 'ngx-markdown';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-create-module',
    imports: [ReactiveFormsModule, DragDropModule, MarkdownModule],
    templateUrl: './create-module.html',
    styleUrl: './create-module.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateModule {
    private moduleService = inject(ModuleService);
    private subModuleService = inject(SubModuleService);
    private userService = inject(UserService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private sectionContentService = inject(SectionContentService);
    private sanitizer = inject(DomSanitizer);

    SectionContentType = SectionContentType; // Expose to template

    // Form
    form = new FormGroup({
        title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
        description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] })
    });

    // Sub-modules
    subModules = signal<SubModule[]>([]);
    subModulesLoading = signal(false);
    subModulesError = signal<string | null>(null);

    // Presentation content
    presentationContents = signal<Partial<SectionContent>[]>([]);
    deletedPresentationContentIds = signal<string[]>([]);
    expandedPresentationIds = signal<Set<string>>(new Set());
    isUploadingImageMap = signal<Record<string, boolean>>({});

    // Presentation save states
    isSavingPresentation = signal(false);
    presentationSaveError = signal<string | null>(null);
    showPresentationSuccess = signal(false);

    constructor() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.savedModuleId.set(id);
            this.loadModule(id);
        }

        effect(() => {
            const moduleId = this.savedModuleId();
            if (moduleId) {
                this.loadSubModules(moduleId);
            }
        });
    }

    async loadModule(id: string) {
        try {
            const module = await this.moduleService.getModuleById(id);
            if (module) {
                this.form.patchValue({
                    title: module.title,
                    description: module.description
                });

                if (module.icon && module.icon.trim()) {
                    this.visualMode.set('icon');
                    this.iconName.set(module.icon.trim());
                    if (module.avatar && module.avatar.trim()) {
                        this.avatarPreviewUrl.set(module.avatar.trim());
                    }
                } else if (module.avatar && module.avatar.trim()) {
                    this.visualMode.set('image');
                    this.avatarPreviewUrl.set(module.avatar.trim());
                } else {
                    this.visualMode.set('image');
                }

                // Load presentation contents
                const contents = await this.sectionContentService.getSectionContentsByModuleId(id);
                this.presentationContents.set(contents);
                if (contents.length > 0 && contents[0].id) {
                    this.expandedPresentationIds.set(new Set([contents[0].id]));
                }
            }
        } catch (err: any) {
            console.error('Erro ao carregar módulo', err);
        }
    }

    async loadSubModules(moduleId: string) {
        this.subModulesLoading.set(true);
        this.subModulesError.set(null);
        try {
            const data = await this.subModuleService.getSubModulesByModuleId(moduleId);
            this.subModules.set(data);
        } catch (err: any) {
            this.subModulesError.set(err.message || 'Erro ao carregar submódulos.');
        } finally {
            this.subModulesLoading.set(false);
        }
    }

    async deleteSubModule(id: string) {
        if (!confirm('Tem certeza que deseja excluir este submódulo?')) return;
        try {
            await this.subModuleService.deleteSubModule(id);
            this.subModules.update(list => list.filter(sm => sm.id !== id));
        } catch (err: any) {
            alert(err.message || 'Erro ao excluir submódulo.');
        }
    }

    // Drag and Drop
    draggedIndex = signal<number | null>(null);

    onDragStart(index: number) {
        this.draggedIndex.set(index);
    }

    onDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        const draggedIdx = this.draggedIndex();
        if (draggedIdx === null || draggedIdx === index) return;

        this.subModules.update(list => {
            const newList = [...list];
            const item = newList.splice(draggedIdx, 1)[0];
            newList.splice(index, 0, item);
            return newList;
        });
        this.draggedIndex.set(index);
    }

    async onDrop() {
        this.draggedIndex.set(null);
        const updates = this.subModules().map((sm, index) => ({ id: sm.id, order: index }));
        try {
            await this.subModuleService.updateSubModuleOrder(updates);
        } catch (err: any) {
            alert('Erro ao reordenar submódulos. A ordem anterior foi restaurada.');
            const moduleId = this.savedModuleId();
            if (moduleId) {
                this.loadSubModules(moduleId);
            }
        }
    }

    // Signals
    visualMode = signal<'image' | 'icon'>('image');
    selectedFile = signal<File | null>(null);
    avatarPreviewUrl = signal<string | null>(null);
    iconName = signal<string | null>(null);

    savedModuleId = signal<string | null>(null);
    isSaving = signal(false);
    saveError = signal<string | null>(null);
    showSuccess = signal(false);

    // Derived Form Values
    titleValue = toSignal(this.form.controls.title.valueChanges, { initialValue: '' });
    descriptionValue = toSignal(this.form.controls.description.valueChanges, { initialValue: '' });

    // Derived Slug
    slug = computed(() => {
        const title = this.titleValue() || '';
        return title
            .normalize('NFD') // decompose accents
            .replace(/[\u0300-\u036f]/g, '') // remove combining marks
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // remove special characters except spaces/hyphens
            .replace(/\s+/g, '-') // convert spaces to hyphens
            .replace(/-+/g, '-') // collapse consecutive hyphens
            .replace(/^-+|-+$/g, ''); // trim hyphens
    });

    // Preview Signal
    previewModule = computed(() => {
        return {
            title: this.titleValue() || 'Título do Módulo',
            description: this.descriptionValue() || 'Uma breve descrição do que os alunos aprenderão neste módulo...',
            slug: this.slug(),
            icon: this.visualMode() === 'icon' ? this.iconName() : undefined,
            avatar: this.visualMode() === 'image' ? this.avatarPreviewUrl() : undefined,
        };
    });

    setVisualMode(mode: 'image' | 'icon') {
        this.visualMode.set(mode);
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            if (file.size > 2 * 1024 * 1024) {
                alert('A imagem não pode ter mais de 2MB.');
                input.value = '';
                return;
            }

            this.selectedFile.set(file);
            const currentUrl = this.avatarPreviewUrl();
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
            this.avatarPreviewUrl.set(URL.createObjectURL(file));
        }
    }

    onIconNameChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.iconName.set(input.value);
    }

    async saveModule() {
        if (this.isSaving()) return;

        this.form.markAllAsTouched();
        if (this.form.invalid) return;

        const user = this.userService.currentUser();
        if (!user) {
            this.saveError.set('Usuário não autenticado.');
            return;
        }

        this.isSaving.set(true);
        this.saveError.set(null);

        try {
            let avatarUrl: string | null = null;
            let iconValue: string | null = null;

            if (this.visualMode() === 'image') {
                const file = this.selectedFile();
                if (file) {
                    avatarUrl = await this.moduleService.uploadModuleAvatar(file);
                } else {
                    avatarUrl = this.avatarPreviewUrl();
                }
                iconValue = null;
            } else {
                iconValue = this.iconName() || null;
                avatarUrl = null;
            }

            if (this.savedModuleId()) {
                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    avatar: avatarUrl,
                    icon: iconValue,
                };
                await this.moduleService.updateModule(this.savedModuleId()!, payload);

                // Save presentation contents
                const contentsToSave = this.presentationContents().map((c, i) => ({ ...c, order: i }));
                await this.sectionContentService.upsertSectionContentsForModule(this.savedModuleId()!, contentsToSave);

                const toDelete = this.deletedPresentationContentIds();
                if (toDelete.length > 0) {
                    await this.sectionContentService.deleteSectionContents(toDelete);
                    this.deletedPresentationContentIds.set([]);
                }

                this.showSuccess.set(true);
                setTimeout(() => this.showSuccess.set(false), 3000);
            } else {
                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    avatar: avatarUrl,
                    icon: iconValue,
                    inRevision: true,
                    createdBy: user.id
                };

                const createdModule = await this.moduleService.createModule(payload);
                await this.moduleService.assignTeacherToModule(user.id, createdModule.id);
                this.savedModuleId.set(createdModule.id);

                // Save presentation contents
                const contentsToSave = this.presentationContents().map((c, i) => ({ ...c, order: i }));
                await this.sectionContentService.upsertSectionContentsForModule(createdModule.id, contentsToSave);

                const toDelete = this.deletedPresentationContentIds();
                if (toDelete.length > 0) {
                    await this.sectionContentService.deleteSectionContents(toDelete);
                    this.deletedPresentationContentIds.set([]);
                }

                this.router.navigate(['/professor/editar-modulo', createdModule.id]);
            }
        } catch (err: any) {
            this.saveError.set(err.message || 'Erro ao salvar o módulo.');
        } finally {
            this.isSaving.set(false);
        }
    }

    createSubModule() {
        const moduleId = this.savedModuleId();
        if (moduleId) {
            this.router.navigate(['/professor/criar-submodulo', moduleId]);
        }
    }

    editSubModule(subModuleId: string) {
        this.router.navigate(['/professor/editar-submodulo', subModuleId]);
    }

    // Presentation Content Actions
    dropPresentationContent(event: CdkDragDrop<Partial<SectionContent>[]>) {
        const currentList = [...this.presentationContents()];
        moveItemInArray(currentList, event.previousIndex, event.currentIndex);
        this.presentationContents.set(currentList);
    }

    addPresentationContent(type: SectionContentType) {
        const newId = crypto.randomUUID();
        const newList = [...this.presentationContents(), {
            id: newId,
            type,
            content: '',
            file: '',
            fileDescription: ''
        }];
        this.presentationContents.set(newList);

        const expanded = new Set(this.expandedPresentationIds());
        expanded.add(newId);
        this.expandedPresentationIds.set(expanded);
    }

    removePresentationContent(index: number) {
        const currentList = [...this.presentationContents()];
        const removed = currentList.splice(index, 1)[0];
        if (removed.id) {
            this.deletedPresentationContentIds.update(ids => [...ids, removed.id!]);
        }
        this.presentationContents.set(currentList);
    }

    updatePresentationContent(index: number, updates: Partial<SectionContent>) {
        const currentList = [...this.presentationContents()];
        currentList[index] = { ...currentList[index], ...updates };
        this.presentationContents.set(currentList);
    }

    async onPresentationImageSelected(index: number, event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const content = this.presentationContents()[index];
        const id = content.id!;

        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem não pode ter mais de 5MB.');
            input.value = '';
            return;
        }

        this.isUploadingImageMap.update(map => ({ ...map, [id]: true }));
        try {
            const publicUrl = await this.sectionContentService.uploadLessonImage(file);
            this.updatePresentationContent(index, { file: publicUrl });
        } catch (error: any) {
            alert(error.message || 'Erro ao fazer upload da imagem.');
            input.value = '';
        } finally {
            this.isUploadingImageMap.update(map => ({ ...map, [id]: false }));
        }
    }

    removePresentationImage(index: number) {
        this.updatePresentationContent(index, { file: '' });
    }

    togglePresentationContent(id: string) {
        const expanded = new Set(this.expandedPresentationIds());
        if (expanded.has(id)) {
            expanded.delete(id);
        } else {
            expanded.add(id);
        }
        this.expandedPresentationIds.set(expanded);
    }

    getSafeHtml(html: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }

    async savePresentation() {
        if (this.isSavingPresentation()) return;

        const moduleId = this.savedModuleId();
        if (!moduleId) {
            this.presentationSaveError.set('Módulo não encontrado.');
            return;
        }

        this.isSavingPresentation.set(true);
        this.presentationSaveError.set(null);
        this.showPresentationSuccess.set(false);

        try {
            const contentsToSave = this.presentationContents().map((c, i) => ({ ...c, order: i }));
            await this.sectionContentService.upsertSectionContentsForModule(moduleId, contentsToSave);

            const toDelete = this.deletedPresentationContentIds();
            if (toDelete.length > 0) {
                await this.sectionContentService.deleteSectionContents(toDelete);
                this.deletedPresentationContentIds.set([]);
            }

            this.showPresentationSuccess.set(true);
            setTimeout(() => this.showPresentationSuccess.set(false), 3000);

            // Reload presentation content to ensure fresh state with IDs from DB
            const contents = await this.sectionContentService.getSectionContentsByModuleId(moduleId);
            this.presentationContents.set(contents);
        } catch (err: any) {
            this.presentationSaveError.set(err.message || 'Erro ao salvar a apresentação.');
        } finally {
            this.isSavingPresentation.set(false);
        }
    }
}
