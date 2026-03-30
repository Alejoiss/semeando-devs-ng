import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuizQuestion {
    id: number;
    statement: string;
    options: string[];
    correctIndex: number;
}

@Component({
    selector: 'app-quiz',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './quiz.html',
    styleUrls: ['./quiz.scss']
})
export class Quiz {
    questions: QuizQuestion[] = [
        { id: 1, statement: 'Qual tag representa o conteúdo principal do documento?', options: ['<header>', '<main>', '<section>', '<footer>'], correctIndex: 1 },
        { id: 2, statement: 'Qual tag é usada para rodapé semântico?', options: ['<aside>', '<footer>', '<nav>', '<article>'], correctIndex: 1 },
        { id: 3, statement: 'Qual tag é ideal para navegação principal?', options: ['<nav>', '<div>', '<header>', '<main>'], correctIndex: 0 },
        { id: 4, statement: 'Qual tag indica um tópico independente?', options: ['<article>', '<section>', '<aside>', '<span>'], correctIndex: 0 },
        { id: 5, statement: 'Qual elemento não é semântico?', options: ['<section>', '<div>', '<article>', '<header>'], correctIndex: 1 },
        { id: 6, statement: 'Qual tag é usada para título de uma seção?', options: ['<h1>', '<p>', '<ul>', '<table>'], correctIndex: 0 },
        { id: 7, statement: 'Qual tag envolve informação tangencial?', options: ['<aside>', '<main>', '<footer>', '<nav>'], correctIndex: 0 },
        { id: 8, statement: 'Qual tag agrupa conteúdo em bloco lógico?', options: ['<section>', '<span>', '<strong>', '<em>'], correctIndex: 0 },
        { id: 9, statement: 'Qual tag é usada para citação em bloco?', options: ['<blockquote>', '<code>', '<br>', '<i>'], correctIndex: 0 },
        { id: 10, statement: 'Qual tag contém metadados e scripts?', options: ['<head>', '<body>', '<html>', '<footer>'], correctIndex: 0 }
    ];

    currentIndex = 0;
    selectedOption: number | null = null;
    confirmed = false;
    finished = false;
    answers: Array<{ questionId: number; correct: boolean; selected: number }> = [];

    get currentQuestion(): QuizQuestion {
        return this.questions[this.currentIndex];
    }

    get progress(): number {
        return this.currentIndex + 1;
    }

    get correctCount(): number {
        return this.answers.filter((a) => a.correct).length;
    }

    get wrongCount(): number {
        return this.answers.filter((a) => !a.correct).length;
    }

    get remaining(): number {
        return this.questions.length - this.answers.length;
    }

    answer(optionIndex: number) {
        if (this.confirmed) {
            return; // não pode mudar após confirmar
        }
        this.selectedOption = optionIndex;
    }

    confirmAnswer() {
        if (this.selectedOption === null || this.confirmed || this.finished) {
            return;
        }

        const isCorrect = this.selectedOption === this.currentQuestion.correctIndex;
        this.answers.push({ questionId: this.currentQuestion.id, correct: isCorrect, selected: this.selectedOption });
        this.confirmed = true;
    }

    next() {
        if (!this.confirmed || this.finished) {
            return;
        }

        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            this.selectedOption = null;
            this.confirmed = false;
        } else {
            this.finished = true;
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        }
    }

    get status() {
        return this.finished ? 'finished' : 'playing';
    }

    get totalQuestions(): number {
        return this.questions.length;
    }

    get scoreLabel(): string {
        return `${this.correctCount}/${this.totalQuestions}`;
    }

    get scorePercent(): number {
        return this.totalQuestions > 0 ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
    }

    get progressCircleCircumference(): number {
        return 2 * Math.PI * 88; // 88 is the radius used in the success circle
    }

    get progressCircleDashoffset(): number {
        return Math.round(this.progressCircleCircumference * (1 - this.scorePercent / 100));
    }

    get progressCircleFailureCircumference(): number {
        return 2 * Math.PI * 70; // 70 is the radius used in the failure circle
    }

    get progressCircleFailureDashoffset(): number {
        return Math.round(this.progressCircleFailureCircumference * (1 - this.scorePercent / 100));
    }

    get passed(): boolean {
        return this.correctCount >= 8;
    }

    restart() {
        this.currentIndex = 0;
        this.selectedOption = null;
        this.confirmed = false;
        this.finished = false;
        this.answers = [];
    }
}

