import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface QuizReviewItem {
    questionId: string;
    index: number;
    correct: boolean;
    title: string;
    reason?: string;
}

@Component({
    selector: 'app-quiz-review',
    standalone: true,
    templateUrl: './quiz-review.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizReview {
    readonly items = input.required<QuizReviewItem[]>();

    protected readonly correctCount = computed(() => this.items().filter(i => i.correct).length);
    protected readonly wrongCount = computed(() => this.items().length - this.correctCount());
}
