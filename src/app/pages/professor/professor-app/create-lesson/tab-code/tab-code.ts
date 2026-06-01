import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LessonService } from '../../../../../services/lesson';
import { CodeEditorModule, CodeModel } from '@ngstack/code-editor';

@Component({
    selector: 'app-tab-code',
    standalone: true,
    imports: [ReactiveFormsModule, CodeEditorModule],
    templateUrl: './tab-code.html',
    styleUrl: './tab-code.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabCode {
    private fb = inject(FormBuilder);
    private lessonService = inject(LessonService);

    lessonId = input<string | null>(null);

    isSaving = signal(false);
    showSuccess = signal(false);
    errorMessage = signal<string | null>(null);

    codeModel: CodeModel = {
        language: 'javascript',
        uri: 'challenge-initial-code',
        value: ''
    };

    codeForm = this.fb.group({
        language: ['', [Validators.required, Validators.minLength(1)]],
    });

    constructor() {
        this.codeForm.get('language')?.valueChanges.subscribe(value => {
            if (value) {
                const lowercaseVal = value.toLowerCase();
                if (value !== lowercaseVal) {
                    this.codeForm.get('language')?.setValue(lowercaseVal, { emitEvent: false });
                }
                this.codeModel = {
                    ...this.codeModel,
                    language: lowercaseVal
                };
            }
        });

        effect(async () => {
            const id = this.lessonId();
            if (id) {
                await this.loadLesson(id);
            }
        });
    }

    async loadLesson(id: string) {
        try {
            const lesson = await this.lessonService.getLessonById(id);
            if (lesson) {
                this.codeForm.patchValue({
                    language: (lesson.language || '').toLowerCase()
                });
                this.codeModel = {
                    language: (lesson.language || 'javascript').toLowerCase(),
                    uri: 'challenge-initial-code',
                    value: lesson.initialCode || ''
                };
            }
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao carregar o código do desafio.');
        }
    }

    async saveCode() {
        if (this.codeForm.invalid || this.isSaving()) return;

        const id = this.lessonId();
        if (!id) {
            this.errorMessage.set('Desafio não identificado.');
            return;
        }

        this.isSaving.set(true);
        this.errorMessage.set(null);

        try {
            await this.lessonService.updateLesson(id, {
                language: this.codeForm.value.language!,
                initialCode: this.codeModel.value,
            });

            await this.lessonService.invalidateLesson(id);

            this.showSuccess.set(true);
            setTimeout(() => this.showSuccess.set(false), 3000);
        } catch (error: any) {
            this.errorMessage.set(error.message || 'Erro ao salvar as configurações de código.');
        } finally {
            this.isSaving.set(false);
        }
    }

    onCodeChanged(value: string) {
        this.codeModel.value = value;
    }
}
