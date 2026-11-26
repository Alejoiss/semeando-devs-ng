import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ModuleService } from '../../../../services/module';
import { UserService } from '../../../../services/user';
import { LessonService } from '../../../../services/lesson';
import { QuizService } from '../../../../services/quiz';
import { Lesson, LessonType } from '../../../../../models/lesson/lesson';

@Component({
    selector: 'app-create-module',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './create-module.html',
    styleUrl: './create-module.scss',
})
export class CreateModule {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private moduleService = inject(ModuleService);
    private userService = inject(UserService);
    private lessonService = inject(LessonService);
    private quizService = inject(QuizService);

    courseId = signal<string | null>(null);

    constructor() {
        const id = this.route.snapshot.paramMap.get('id');
        const mId = this.route.snapshot.paramMap.get('courseId');

        if (id) {
            this.savedModuleId.set(id);
            this.loadModule(id);
        }

        if (mId) {
            this.courseId.set(mId);
        }

        effect(() => {
            const savedId = this.savedModuleId();
            if (savedId) {
                this.loadLessons(savedId);
            }
        });
    }

    async loadModule(id: string) {
        try {
            const sm = await this.moduleService.getModuleById(id);
            if (sm) {
                this.form.patchValue({
                    title: sm.title,
                    description: sm.description,
                });
                this.courseId.set((sm as any).module_id);
                this.published.set(sm.published === true);

                if (sm.icon && sm.icon.trim()) {
                    this.visualMode.set('icon');
                    this.iconName.set(sm.icon.trim());
                    if (sm.avatar && sm.avatar.trim()) {
                        this.avatarPreviewUrl.set(sm.avatar.trim());
                    }
                } else if (sm.avatar && sm.avatar.trim()) {
                    this.visualMode.set('image');
                    this.avatarPreviewUrl.set(sm.avatar.trim());
                } else {
                    this.visualMode.set('image');
                }
            }
        } catch (err) {
            console.error('Erro ao carregar módulo', err);
        }
    }

    // Lessons
    lessons = signal<Lesson[]>([]);
    lessonsLoading = signal(false);
    lessonsError = signal<string | null>(null);
    isValidating = signal<string | null>(null);
    lessonTypeRef = LessonType;

    async loadLessons(moduleId: string) {
        this.lessonsLoading.set(true);
        this.lessonsError.set(null);
        try {
            const data = await this.lessonService.getLessonsByModuleId(moduleId);
            this.lessons.set(data);
        } catch (err: any) {
            this.lessonsError.set(err.message || 'Erro ao carregar lições.');
        } finally {
            this.lessonsLoading.set(false);
        }
    }
    async createRevision() {
        const moduleId = this.savedModuleId();
        if (!moduleId) return;

        this.lessonsLoading.set(true);
        this.lessonsError.set(null);
        try {
            const user = this.userService.currentUser();
            if (!user) throw new Error('Usuário não autenticado.');

            const moduleName = this.form.controls.title.value || '';
            const lessonCount = await this.lessonService.getLessonCountByModuleId(moduleId);

            const createdLesson = await this.lessonService.createLesson({
                title: 'Revisão do módulo ' + moduleName,
                description: 'Vamos revisar o que aprendemos até aqui neste módulo',
                type: LessonType.REVISION,
                order: lessonCount + 1,
                moduleId: moduleId,
                xp: 50,
                createdBy: user.id,
                isValidated: false,
            });

            await this.quizService.getOrCreateQuiz(createdLesson.id);

            await this.loadLessons(moduleId);
        } catch (err: any) {
            this.lessonsError.set(err.message || 'Erro ao criar lição de revisão.');
        } finally {
            this.lessonsLoading.set(false);
        }
    }

    async deleteLesson(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta lição?')) return;
        try {
            await this.lessonService.deleteLesson(id);
            this.lessons.update((list) => list.filter((l) => l.id !== id));
        } catch (err: any) {
            alert(err.message || 'Erro ao excluir lição.');
        }
    }

    async validateLesson(lesson: Lesson) {
        if (this.isValidating()) return;
        this.isValidating.set(lesson.id);
        try {
            const passed = await this.lessonService.validateLesson(lesson.id, lesson.type);
            this.lessons.update(list =>
                list.map(l => l.id === lesson.id ? { ...l, isValidated: passed } : l)
            );
        } catch (err: any) {
            alert(err.message || 'Erro ao validar lição.');
        } finally {
            this.isValidating.set(null);
        }
    }

    published = signal(false);
    isPublishing = signal(false);
    publishError = signal<string | null>(null);

    async publishModule() {
        const moduleId = this.savedModuleId();
        if (!moduleId || this.isPublishing()) return;
        this.isPublishing.set(true);
        this.publishError.set(null);
        try {
            const lessons = this.lessons();
            if (!lessons.length) {
                this.publishError.set('O módulo não tem lições.');
                return;
            }
            const results: Lesson[] = [];
            for (const lesson of lessons) {
                const passed = await this.lessonService.validateLesson(lesson.id, lesson.type);
                results.push({ ...lesson, isValidated: passed });
            }
            this.lessons.set(results);
            const failed = results.filter(l => l.isValidated !== true);
            if (failed.length) {
                this.publishError.set(`Valide estas lições antes de publicar: ${failed.map(l => l.title).join(', ')}.`);
                return;
            }
            await this.moduleService.setModulePublished(moduleId, true);
            this.published.set(true);
        } catch (err: any) {
            this.publishError.set(err.message || 'Erro ao publicar o módulo.');
        } finally {
            this.isPublishing.set(false);
        }
    }

    async unpublishModule() {
        const moduleId = this.savedModuleId();
        if (!moduleId || this.isPublishing()) return;
        this.isPublishing.set(true);
        this.publishError.set(null);
        try {
            await this.moduleService.setModulePublished(moduleId, false);
            this.published.set(false);
        } catch (err: any) {
            this.publishError.set(err.message || 'Erro ao despublicar o módulo.');
        } finally {
            this.isPublishing.set(false);
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

        this.lessons.update((list) => {
            const newList = [...list];
            const item = newList.splice(draggedIdx, 1)[0];
            newList.splice(index, 0, item);
            return newList;
        });
        this.draggedIndex.set(index);
    }

    async onDrop() {
        this.draggedIndex.set(null);
        const updates = this.lessons().map((l, index) => ({ id: l.id, order: index }));
        try {
            await this.lessonService.updateLessonOrder(updates);
        } catch (err: any) {
            alert('Erro ao reordenar lições. A ordem anterior foi restaurada.');
            const moduleId = this.savedModuleId();
            if (moduleId) {
                this.loadLessons(moduleId);
            }
        }
    }

    form = this.fb.nonNullable.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
    });

    // State
    visualMode = signal<'image' | 'icon'>('image');
    iconName = signal<string>('');
    avatarFile = signal<File | null>(null);
    avatarPreviewUrl = signal<string | null>(null);

    isSaving = signal(false);
    saveError = signal<string | null>(null);
    showSuccess = signal(false);

    savedModuleId = signal<string | null>(null);

    // State
    titleSignal = toSignal(this.form.controls.title.valueChanges, { initialValue: '' });

    // Derived state
    slug = computed(() => {
        return this.titleSignal()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    });

    previewModule = computed(() => {
        return {
            title: this.titleSignal() || 'Título do Módulo',
            description: this.form.controls.description.value || 'Descrição do que os alunos vão aprender...',
            icon: this.visualMode() === 'icon' ? this.iconName() : null,
            avatar: this.visualMode() === 'image' ? this.avatarPreviewUrl() : null,
        };
    });

    setVisualMode(mode: 'image' | 'icon') {
        this.visualMode.set(mode);
        if (mode === 'image') {
            this.iconName.set('');
        } else {
            this.avatarFile.set(null);
            this.avatarPreviewUrl.set(null);
        }
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            this.avatarFile.set(file);
            const url = URL.createObjectURL(file);
            this.avatarPreviewUrl.set(url);
        }
    }

    onIconNameChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.iconName.set(value);
    }

    async saveModule() {
        if (this.isSaving()) return;

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

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
                const file = this.avatarFile();
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

            const isEdit = !!this.savedModuleId();

            if (isEdit) {
                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    avatar: avatarUrl,
                    icon: iconValue,
                };
                await this.moduleService.updateModule(this.savedModuleId()!, payload);
                this.showSuccess.set(true);
                setTimeout(() => this.showSuccess.set(false), 3000);
            } else {
                const mId = this.courseId();
                if (!mId) {
                    throw new Error('ID do curso não encontrado.');
                }

                const moduleCount = await this.moduleService.getModuleCountByCourseId(mId);

                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    module_id: mId,
                    avatar: avatarUrl,
                    icon: iconValue,
                    order: moduleCount + 1,
                };

                const created = await this.moduleService.createModule(payload);
                this.savedModuleId.set(created.id);
                this.router.navigate(['/professor/editar-modulo', created.id], { replaceUrl: true });
            }
        } catch (err: any) {
            this.saveError.set(err.message || 'Erro ao salvar o módulo.');
        } finally {
            this.isSaving.set(false);
        }
    }

    goBack() {
        const mId = this.courseId();
        if (mId) {
            this.router.navigate(['/professor/editar-curso', mId]);
        } else {
            this.router.navigate(['/professor/meus-cursos']);
        }
    }
}
