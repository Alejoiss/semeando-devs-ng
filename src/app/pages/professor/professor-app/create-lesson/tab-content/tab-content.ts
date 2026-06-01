import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LessonService } from '../../../../../services/lesson';
import { UserService } from '../../../../../services/user';
import { LessonType } from '../../../../../../models/lesson/lesson';
import { SectionContentService } from '../../../../../services/section-content';
import { SectionContent, SectionContentType } from '../../../../../../models/section-content/section-content';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CodeEditorModule, CodeModel } from '@ngstack/code-editor';
import { MarkdownModule } from 'ngx-markdown';

@Component({
    selector: 'app-tab-content',
    standalone: true,
    imports: [ReactiveFormsModule, DragDropModule, CodeEditorModule, MarkdownModule],
    templateUrl: './tab-content.html',
    styleUrl: './tab-content.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabContent {
    private fb = inject(FormBuilder);
    private lessonService = inject(LessonService);
    private userService = inject(UserService);
    private router = inject(Router);
    private sectionContentService = inject(SectionContentService);
    private sanitizer = inject(DomSanitizer);

    SectionContentType = SectionContentType; // Expose to template

    getSafeHtml(html: string | undefined): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html || '');
    }

    subModuleId = input<string | null>(null);
    lessonId = input<string | null>(null);
    lessonType = input<LessonType>(LessonType.LESSON);

    isSaving = signal(false);
    showSuccess = signal(false);
    errorMessage = signal<string | null>(null);

    contentList = signal<Partial<SectionContent>[]>([]);
    contentIdsToDelete = signal<string[]>([]);

    isEvaluating = signal(false);
    aiFeedback = signal<string | null>(null);

    hasMarkdownContent = computed(() => this.contentList().some(c => c.type === SectionContentType.MARKDOWN));
    canEvaluate = computed(() => this.hasMarkdownContent() && !this.isSaving() && !this.isEvaluating() && !!this.lessonId());

    // Cache for editor models to prevent cursor jumps on re-render
    codeModels: Record<string, CodeModel> = {};

    getCodeModel(content: Partial<SectionContent>): CodeModel {
        const id = content.id || 'temp';
        if (!this.codeModels[id]) {
            this.codeModels[id] = {
                language: 'markdown',
                uri: `${id}.md`,
                value: content.content || ''
            };
        }
        return this.codeModels[id];
    }

    // To track which accordions are expanded
    expandedContentIds = signal<Set<string>>(new Set());

    // Track image upload loading state per content item
    isUploadingImageMap = signal<Record<string, boolean>>({});

    lessonForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: ['', [Validators.required, Validators.minLength(10)]],
    });

    constructor() {
        effect(async () => {
            const id = this.lessonId();
            if (id) {
                await this.loadLesson(id);
            }
        });
    }

    async loadLesson(id: string) {
        try {
            this.codeModels = {}; // Reset editor cache
            const lesson = await this.lessonService.getLessonById(id);
            if (lesson) {
                this.lessonForm.patchValue({
                    title: lesson.title,
                    description: lesson.description,
                });
            }
            const contents = await this.sectionContentService.getSectionContentsByLessonId(id);
            this.contentList.set(contents);
            // Default expand first item if exists
            if (contents.length > 0 && contents[0].id) {
                this.expandedContentIds.set(new Set([contents[0].id]));
            }
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao carregar a lição.');
        }
    }

    async saveLesson() {
        if (this.lessonForm.invalid || this.isSaving()) return;

        this.isSaving.set(true);
        this.errorMessage.set(null);

        try {
            const id = this.lessonId();

            if (id) {
                // Modo Edição
                await this.lessonService.updateLesson(id, {
                    title: this.lessonForm.value.title!,
                    description: this.lessonForm.value.description!,
                });

                const contentsToSave = this.contentList().map((c, i) => ({ ...c, order: i }));
                await this.sectionContentService.upsertSectionContents(id, contentsToSave);

                const toDelete = this.contentIdsToDelete();
                if (toDelete.length > 0) {
                    await this.sectionContentService.deleteSectionContents(toDelete);
                    this.contentIdsToDelete.set([]);
                }

                await this.lessonService.invalidateLesson(id);

                this.showSuccess.set(true);
                setTimeout(() => this.showSuccess.set(false), 3000);
            } else {
                // Modo Criação
                const smId = this.subModuleId();
                if (!smId) {
                    this.errorMessage.set('Submódulo não identificado.');
                    this.isSaving.set(false);
                    return;
                }
                const user = this.userService.currentUser();
                if (!user) throw new Error('Usuário não autenticado.');

                const lessonCount = await this.lessonService.getLessonCountBySubModuleId(smId);

                const newLesson = await this.lessonService.createLesson({
                    title: this.lessonForm.value.title!,
                    description: this.lessonForm.value.description!,
                    type: this.lessonType(),
                    order: lessonCount + 1,
                    subModuleId: smId,
                    xp: 50,
                    createdBy: user.id,
                });

                this.router.navigate(['/professor/editar-licao', newLesson.id]);
            }
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao salvar a lição.');
        } finally {
            this.isSaving.set(false);
        }
    }

    // Drag & Drop
    dropContent(event: CdkDragDrop<Partial<SectionContent>[]>) {
        const currentList = [...this.contentList()];
        moveItemInArray(currentList, event.previousIndex, event.currentIndex);
        this.contentList.set(currentList);
    }

    addContent(type: SectionContentType) {
        const newId = crypto.randomUUID();
        const newList = [...this.contentList(), {
            id: newId,
            type,
            content: '',
            file: '',
            fileDescription: ''
        }];
        this.contentList.set(newList);

        const expanded = new Set(this.expandedContentIds());
        expanded.add(newId);
        this.expandedContentIds.set(expanded);
    }

    removeContent(index: number) {
        const currentList = [...this.contentList()];
        const removed = currentList.splice(index, 1)[0];
        if (removed.id) {
            delete this.codeModels[removed.id]; // Clean cache
            // Keep track of all IDs to delete, Supabase upsert requires valid UUIDs.
            // When removing we just push to the toDelete list.
            // If it's a newly added content (that was never saved), it might fail deletion,
            // but we can catch or ignore it in the service or just let it pass.
            this.contentIdsToDelete.update(ids => [...ids, removed.id!]);
        }
        this.contentList.set(currentList);
    }

    updateContent(index: number, updates: Partial<SectionContent>) {
        const currentList = [...this.contentList()];
        const item = { ...currentList[index], ...updates };
        currentList[index] = item;
        this.contentList.set(currentList);

        // Update cached code model value to keep it in sync, without changing reference
        if (item.id && updates.content !== undefined && this.codeModels[item.id]) {
            this.codeModels[item.id].value = updates.content;
        }
    }

    async onImageSelected(index: number, event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const content = this.contentList()[index];
        const id = content.id!;

        // Validate size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.errorMessage.set('A imagem não pode ter mais de 5MB.');
            input.value = '';
            return;
        }

        // Set loading state
        this.isUploadingImageMap.update(map => ({ ...map, [id]: true }));
        this.errorMessage.set(null);

        try {
            const publicUrl = await this.sectionContentService.uploadLessonImage(file);
            this.updateContent(index, { file: publicUrl });
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao fazer upload da imagem.');
            input.value = '';
        } finally {
            this.isUploadingImageMap.update(map => ({ ...map, [id]: false }));
        }
    }

    removeImage(index: number) {
        this.updateContent(index, { file: '' });
    }

    toggleContent(id: string) {
        const expanded = new Set(this.expandedContentIds());
        if (expanded.has(id)) {
            expanded.delete(id);
        } else {
            expanded.add(id);
        }
        this.expandedContentIds.set(expanded);
    }

    async evaluateContent() {
        if (!this.canEvaluate()) return;

        this.isEvaluating.set(true);
        this.errorMessage.set(null);
        this.aiFeedback.set(null);

        try {
            const title = this.lessonForm.value.title || '';
            const description = this.lessonForm.value.description || '';

            // Extract only the markdowns section blocks
            const markdowns = this.contentList()
                .filter(c => c.type === SectionContentType.MARKDOWN && c.content)
                .map(c => c.content!);

            if (markdowns.length === 0) {
                this.errorMessage.set('Adicione algum conteúdo no bloco de Markdown antes de avaliar.');
                return;
            }

            const response = await this.sectionContentService.evaluateLessonContent(this.lessonId()!, title, description, markdowns);
            this.aiFeedback.set(response.aiFeedback);
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Ocorreu um erro ao processar a avaliação com a IA.');
        } finally {
            this.isEvaluating.set(false);
        }
    }
}
