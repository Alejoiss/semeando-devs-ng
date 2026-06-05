import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExtraMaterialService } from '../../../../../services/extra-material';
import { LessonService } from '../../../../../services/lesson';
import { ExtraMaterial, ExtraMaterialType } from '../../../../../../models/extra-material/extra-material';

interface JsonImportItem {
    title: string;
    url: string;
}

@Component({
    selector: 'app-tab-extra-material',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './tab-extra-material.html',
    styleUrl: './tab-extra-material.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabExtraMaterial {
    private fb = inject(FormBuilder);
    private extraMaterialService = inject(ExtraMaterialService);
    private lessonService = inject(LessonService);

    lessonId = input<string | null>(null);

    isLoading = signal(false);
    isSaving = signal(false);
    showSuccess = signal(false);
    errorMessage = signal<string | null>(null);

    isImportModalOpen = signal(false);
    importError = signal<string | null>(null);
    importRawJson = signal('');

    form = this.fb.group({
        materials: this.fb.array([])
    });

    // List of loaded material IDs to check if a deleted material existed in the DB
    private loadedMaterialIds = new Set<string>();
    private materialsToDelete = signal<string[]>([]);

    constructor() {
        effect(async () => {
            const id = this.lessonId();
            if (id) {
                await this.loadExtraMaterials(id);
            }
        });
    }

    get materials(): FormArray {
        return this.form.get('materials') as FormArray;
    }

    async loadExtraMaterials(lessonId: string) {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.loadedMaterialIds.clear();
        this.materialsToDelete.set([]);

        // Clear FormArray
        while (this.materials.length !== 0) {
            this.materials.removeAt(0);
        }

        try {
            const existing = await this.extraMaterialService.getExtraMaterialsByLessonId(lessonId);
            for (const item of existing) {
                if (item.id) {
                    this.loadedMaterialIds.add(item.id);
                }
                this.materials.push(this.fb.group({
                    id: [item.id],
                    title: [item.title || '', [Validators.required]],
                    type: [item.type || ExtraMaterialType.URL],
                    url: [item.url || '', [Validators.required, Validators.pattern(/https?:\/\/.+/)]]
                }));
            }
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao carregar materiais extras.');
        } finally {
            this.isLoading.set(false);
        }
    }

    addMaterial() {
        this.materials.push(this.fb.group({
            id: [crypto.randomUUID()],
            title: ['', [Validators.required]],
            type: [ExtraMaterialType.URL],
            url: ['', [Validators.required, Validators.pattern(/https?:\/\/.+/)]]
        }));
    }

    removeMaterial(index: number) {
        const group = this.materials.at(index);
        const id = group.get('id')?.value;

        if (id && this.loadedMaterialIds.has(id)) {
            this.materialsToDelete.update(ids => [...ids, id]);
        }

        this.materials.removeAt(index);
    }

    async save() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const id = this.lessonId();
        if (!id) {
            this.errorMessage.set('Lição não identificada.');
            return;
        }

        this.isSaving.set(true);
        this.errorMessage.set(null);

        try {
            // Persist deletions first
            const toDelete = this.materialsToDelete();
            if (toDelete.length > 0) {
                await this.extraMaterialService.deleteExtraMaterials(toDelete);
            }

            // Persist additions/updates
            const materialsList: Partial<ExtraMaterial>[] = this.materials.value;
            if (materialsList.length > 0) {
                await this.extraMaterialService.upsertExtraMaterials(id, materialsList);
            }

            // Reload to sync database state
            await this.loadExtraMaterials(id);

            await this.lessonService.invalidateLesson(id);

            this.showSuccess.set(true);
            setTimeout(() => this.showSuccess.set(false), 3000);
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao salvar os materiais extras.');
        } finally {
            this.isSaving.set(false);
        }
    }
    openImportModal() {
        this.isImportModalOpen.set(true);
    }

    closeImportModal() {
        this.isImportModalOpen.set(false);
        this.importError.set(null);
        this.importRawJson.set('');
    }

    updateImportJson(value: string) {
        this.importRawJson.set(value);
    }

    importFromJson() {
        this.importError.set(null);
        const raw = this.importRawJson();

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            this.importError.set('JSON inválido. Verifique a sintaxe.');
            return;
        }

        if (!Array.isArray(parsed)) {
            this.importError.set('O payload deve ser um array de materiais.');
            return;
        }

        const items = parsed as JsonImportItem[];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.title || item.title.trim() === '') {
                this.importError.set(`Item ${i + 1}: campo "title" ausente ou vazio.`);
                return;
            }
            if (!item.url || !/https?:\/\/.+/.test(item.url)) {
                this.importError.set(`Item ${i + 1}: campo "url" ausente ou inválido (deve começar com http:// ou https://).`);
                return;
            }
        }

        while (this.materials.length !== 0) {
            this.materials.removeAt(0);
        }

        for (const item of items) {
            this.materials.push(this.fb.group({
                id: [crypto.randomUUID()],
                title: [item.title, [Validators.required]],
                type: [ExtraMaterialType.URL],
                url: [item.url, [Validators.required, Validators.pattern(/https?:\/\/.+/)]]
            }));
        }

        this.closeImportModal();
    }
}
