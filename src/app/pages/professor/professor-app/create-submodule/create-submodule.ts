import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SubModuleService } from '../../../../services/sub-module';
import { UserService } from '../../../../services/user';
import { LessonService } from '../../../../services/lesson';
import { Lesson, LessonType } from '../../../../../models/lesson/lesson';

@Component({
    selector: 'app-create-submodule',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './create-submodule.html',
    styleUrl: './create-submodule.scss',
})
export class CreateSubmodule {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private subModuleService = inject(SubModuleService);
    private userService = inject(UserService);
    private lessonService = inject(LessonService);

    moduleId = signal<string | null>(null);

    constructor() {
        const id = this.route.snapshot.paramMap.get('id');
        const mId = this.route.snapshot.paramMap.get('moduleId');

        if (id) {
            this.savedSubModuleId.set(id);
            this.loadSubModule(id);
        }

        if (mId) {
            this.moduleId.set(mId);
        }

        effect(() => {
            const savedId = this.savedSubModuleId();
            if (savedId) {
                this.loadLessons(savedId);
            }
        });
    }

    async loadSubModule(id: string) {
        try {
            const sm = await this.subModuleService.getSubModuleById(id);
            if (sm) {
                this.form.patchValue({
                    title: sm.title,
                    description: sm.description,
                });
                this.moduleId.set((sm as any).module_id);

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
            console.error('Erro ao carregar submódulo', err);
        }
    }

    // Lessons
    lessons = signal<Lesson[]>([]);
    lessonsLoading = signal(false);
    lessonsError = signal<string | null>(null);

    async loadLessons(subModuleId: string) {
        this.lessonsLoading.set(true);
        this.lessonsError.set(null);
        try {
            const data = await this.lessonService.getLessonsBySubModuleId(subModuleId);
            this.lessons.set(data);
        } catch (err: any) {
            this.lessonsError.set(err.message || 'Erro ao carregar lições.');
        } finally {
            this.lessonsLoading.set(false);
        }
    }
    async createRevision() {
        const subModuleId = this.savedSubModuleId();
        if (!subModuleId) return;

        this.lessonsLoading.set(true);
        this.lessonsError.set(null);
        try {
            const user = this.userService.currentUser();
            if (!user) throw new Error('Usuário não autenticado.');

            const subModuleName = this.form.controls.title.value || '';
            const lessonCount = await this.lessonService.getLessonCountBySubModuleId(subModuleId);

            await this.lessonService.createLesson({
                title: 'Revisão do submódulo ' + subModuleName,
                description: 'Vamos revisar o que aprendemos até aqui neste submódulo',
                type: LessonType.REVISION,
                order: lessonCount + 1,
                subModuleId: subModuleId,
                xp: 50,
                createdBy: user.id,
            });

            await this.loadLessons(subModuleId);
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
            const subModuleId = this.savedSubModuleId();
            if (subModuleId) {
                this.loadLessons(subModuleId);
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

    savedSubModuleId = signal<string | null>(null);

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

    previewSubModule = computed(() => {
        return {
            title: this.titleSignal() || 'Título do Submódulo',
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

    async saveSubModule() {
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
                    avatarUrl = await this.subModuleService.uploadSubModuleAvatar(file);
                } else {
                    avatarUrl = this.avatarPreviewUrl();
                }
                iconValue = null;
            } else {
                iconValue = this.iconName() || null;
                avatarUrl = null;
            }

            const isEdit = !!this.savedSubModuleId();

            if (isEdit) {
                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    avatar: avatarUrl,
                    icon: iconValue,
                };
                await this.subModuleService.updateSubModule(this.savedSubModuleId()!, payload);
                this.showSuccess.set(true);
                setTimeout(() => this.showSuccess.set(false), 3000);
            } else {
                const mId = this.moduleId();
                if (!mId) {
                    throw new Error('ID do módulo não encontrado.');
                }

                const subModuleCount = await this.subModuleService.getSubModuleCountByModuleId(mId);

                const payload = {
                    title: this.form.controls.title.value,
                    description: this.form.controls.description.value,
                    slug: this.slug(),
                    module_id: mId,
                    avatar: avatarUrl,
                    icon: iconValue,
                    order: subModuleCount + 1,
                };

                const created = await this.subModuleService.createSubModule(payload);
                this.savedSubModuleId.set(created.id);
                this.router.navigate(['/professor/editar-submodulo', created.id], { replaceUrl: true });
            }
        } catch (err: any) {
            this.saveError.set(err.message || 'Erro ao salvar o submódulo.');
        } finally {
            this.isSaving.set(false);
        }
    }

    goBack() {
        const mId = this.moduleId();
        if (mId) {
            this.router.navigate(['/professor/editar-modulo', mId]);
        } else {
            this.router.navigate(['/professor/meus-modulos']);
        }
    }
}
