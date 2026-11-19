import { TestBed } from '@angular/core/testing';
import { QuizReview, QuizReviewItem } from './quiz-review';

describe('QuizReview', () => {
    const items: QuizReviewItem[] = [
        { questionId: 'a', index: 1, correct: true, title: 'Primeira' },
        { questionId: 'b', index: 2, correct: false, title: 'Segunda', reason: 'Porque sim.' },
        { questionId: 'c', index: 3, correct: false, title: 'Terceira' },
    ];

    function render() {
        const fixture = TestBed.createComponent(QuizReview);
        fixture.componentRef.setInput('items', items);
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    it('lists every question with a text status, not only color', () => {
        const el = render();
        const rows = el.querySelectorAll('li');
        expect(rows.length).toBe(3);
        expect(rows[0].querySelector('.sr-only')!.textContent).toContain('correta');
        expect(rows[2].querySelector('.sr-only')!.textContent).toContain('errada');
    });

    it('summarizes the counts', () => {
        expect(render().textContent).toContain('1 certa · 2 erradas');
    });

    it('only makes wrong answers with a reason expandable', () => {
        const el = render();
        const details = el.querySelectorAll('details');
        expect(details.length).toBe(1);
        expect(details[0].textContent).toContain('Porque sim.');
    });
});
