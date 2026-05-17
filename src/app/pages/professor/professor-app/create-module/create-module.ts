import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleService } from '../../../../services/module';
import { SubModuleService } from '../../../../services/sub-module';
import { UserService } from '../../../../services/user';
import { toSignal } from '@angular/core/rxjs-interop';
import { SubModule } from '../../../../../models/sub-module/sub-module';

@Component({
    selector: 'app-create-module',
    imports: [ReactiveFormsModule],
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

    // Form
    form = new FormGroup({
        title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
        description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10)] })
    });

    // Sub-modules
    subModules = signal<SubModule[]>([]);
    subModulesLoading = signal(false);
    subModulesError = signal<string | null>(null);

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
}
