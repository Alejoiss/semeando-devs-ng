import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../services/course';
import { ModuleService } from '../../../../services/module';
import { UserService } from '../../../../services/user';
import { toSignal } from '@angular/core/rxjs-interop';
import { Module } from '../../../../../models/module/module';
import { SectionContentService } from '../../../../services/section-content';
import { SectionContent, SectionContentType } from '../../../../../models/section-content/section-content';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MarkdownModule } from 'ngx-markdown';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-create-course',
    imports: [ReactiveFormsModule, DragDropModule, MarkdownModule],
    templateUrl: './create-course.html',
    styleUrl: './create-course.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCourse {
    private courseService = inject(CourseService);
    private moduleService = inject(ModuleService);
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

    // Sub-courses
    modules = signal<Module[]>([]);
    modulesLoading = signal(false);
    modulesError = signal<string | null>(null);

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
            this.savedCourseId.set(id);
            this.loadCourse(id);
        }

        effect(() => {
            const courseId = this.savedCourseId();
            if (courseId) {
                this.loadModules(courseId);
            }
        });
    }

    async loadCourse(id: string) {
        try {
            const course = await this.courseService.getCourseById(id);
            if (course) {
                this.form.patchValue({
                    title: course.title,
                    description: course.description
                });

                if (course.icon && course.icon.trim()) {
                    this.visualMode.set('icon');
                    this.iconName.set(course.icon.trim());
                    if (course.avatar && course.avatar.trim()) {
                        this.avatarPreviewUrl.set(course.avatar.trim());
                    }
                } else if (course.avatar && course.avatar.trim()) {
                    this.visualMode.set('image');
                    this.avatarPreviewUrl.set(course.avatar.trim());
                } else {
                    this.visualMode.set('image');
                }

                // Load presentation contents
                const contents = await this.sectionContentService.getSectionContentsByCourseId(id);
                this.presentationContents.set(contents);
                if (contents.length > 0 && contents[0].id) {
                    this.expandedPresentationIds.set(new Set([contents[0].id]));
                }
            }
        } catch (err: any) {
            console.error('Erro ao carregar curso', err);
        }
    }

    async loadModules(courseId: string) {
        this.modulesLoading.set(true);
        this.modulesError.set(null);
        try {
            const data = await this.moduleService.getModulesByCourseId(courseId);
            this.modules.set(data);
        } catch (err: any) {
            this.modulesError.set(err.message || 'Erro ao carregar módulos.');
        } finally {
            this.modulesLoading.set(false);
        }
    }

    async deleteModule(id: string) {
        if (!confirm('Tem certeza que deseja excluir este módulo?')) return;
        try {
            await this.moduleService.deleteModule(id);
            this.modules.update(list => list.filter(sm => sm.id !== id));
        } catch (err: any) {
            alert(err.message || 'Erro ao excluir módulo.');
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

        this.modules.update(list => {
            const newList = [...list];
            const item = newList.splice(draggedIdx, 1)[0];
            newList.splice(index, 0, item);
            return newList;
        });
        this.draggedIndex.set(index);
    }

    async onDrop() {
        this.draggedIndex.set(null);
        const updates = this.modules().map((sm, index) => ({ id: sm.id, order: index }));
        try {
            await this.moduleService.updateModuleOrder(updates);
        } catch (err: any) {
            alert('Erro ao reordenar módulos. A ordem anterior foi restaurada.');
            const courseId = this.savedCourseId();
            if (courseId) {
                this.loadModules(courseId);
            }
        }
    }

    // Signals
    visualMode = signal<'image' | 'icon'>('image');
    selectedFile = signal<File | null>(null);
    avatarPreviewUrl = signal<string | null>(null);
    iconName = signal<string | null>(null);

    savedCourseId = signal<string | null>(null);
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
    previewCourse = computed(() => {
        return {
            title: this.titleValue() || 'Título do Curso',
            description: this.descriptionValue() || 'Uma breve descrição do que os alunos aprenderão neste curso...',
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

    async saveCourse() {
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
                    avatarUrl = await this.courseService.uploadCourseAvatar(file);
                } else {
                    avatarUrl = this.avatarPreviewUrl();
                }
                iconValue = null;
            } else {
                iconValue = this.iconName() || null;
                avatarUrl = null;
            }

            if (this.savedCourseId()) {
                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    avatar: avatarUrl,
                    icon: iconValue,
                };
                await this.courseService.updateCourse(this.savedCourseId()!, payload);

                // Save presentation contents
                const contentsToSave = this.presentationContents().map((c, i) => ({ ...c, order: i }));
                await this.sectionContentService.upsertSectionContentsForCourse(this.savedCourseId()!, contentsToSave);

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

                const createdCourse = await this.courseService.createCourse(payload);
                await this.courseService.assignTeacherToCourse(user.id, createdCourse.id);
                this.savedCourseId.set(createdCourse.id);

                // Save presentation contents
                const contentsToSave = this.presentationContents().map((c, i) => ({ ...c, order: i }));
                await this.sectionContentService.upsertSectionContentsForCourse(createdCourse.id, contentsToSave);

                const toDelete = this.deletedPresentationContentIds();
                if (toDelete.length > 0) {
                    await this.sectionContentService.deleteSectionContents(toDelete);
                    this.deletedPresentationContentIds.set([]);
                }

                this.router.navigate(['/professor/editar-curso', createdCourse.id]);
            }
        } catch (err: any) {
            this.saveError.set(err.message || 'Erro ao salvar o curso.');
        } finally {
            this.isSaving.set(false);
        }
    }

    createModule() {
        const courseId = this.savedCourseId();
        if (courseId) {
            this.router.navigate(['/professor/criar-modulo', courseId]);
        }
    }

    editModule(moduleId: string) {
        this.router.navigate(['/professor/editar-modulo', moduleId]);
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

        const courseId = this.savedCourseId();
        if (!courseId) {
            this.presentationSaveError.set('Curso não encontrado.');
            return;
        }

        this.isSavingPresentation.set(true);
        this.presentationSaveError.set(null);
        this.showPresentationSuccess.set(false);

        try {
            const contentsToSave = this.presentationContents().map((c, i) => ({ ...c, order: i }));
            await this.sectionContentService.upsertSectionContentsForCourse(courseId, contentsToSave);

            const toDelete = this.deletedPresentationContentIds();
            if (toDelete.length > 0) {
                await this.sectionContentService.deleteSectionContents(toDelete);
                this.deletedPresentationContentIds.set([]);
            }

            this.showPresentationSuccess.set(true);
            setTimeout(() => this.showPresentationSuccess.set(false), 3000);

            // Reload presentation content to ensure fresh state with IDs from DB
            const contents = await this.sectionContentService.getSectionContentsByCourseId(courseId);
            this.presentationContents.set(contents);
        } catch (err: any) {
            this.presentationSaveError.set(err.message || 'Erro ao salvar a apresentação.');
        } finally {
            this.isSavingPresentation.set(false);
        }
    }
}
