import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Answer } from '../../../../models/answer/answer';
import { Question } from '../../../../models/question/question';
import { Quiz as QuizModel } from '../../../../models/quiz/quiz';
import { LessonType } from '../../../../models/lesson/lesson';
import { UserQuiz } from '../../../../models/user-quiz/user-quiz';
import { AnswerService } from '../../../services/answer';
import { LessonService } from '../../../services/lesson';
import { QuestionService } from '../../../services/question';
import { QuizService } from '../../../services/quiz';
import { UserService } from '../../../services/user';
import { UserQuestionService } from '../../../services/user-question';
import { UserQuizService } from '../../../services/user-quiz';
import { XpService } from '../../../services/xp';
import { MarkdownModule } from 'ngx-markdown';

interface QuizResult {
    questionId: string;
    correct: boolean;
    answerId: string;
}

@Component({
    selector: 'app-quiz',
    standalone: true,
    imports: [CommonModule, RouterLink, MarkdownModule],
    templateUrl: './quiz.html',
    styleUrls: ['./quiz.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quiz implements OnInit {
    public route = inject(ActivatedRoute);
    private userService = inject(UserService);
    private lessonService = inject(LessonService);
    private quizService = inject(QuizService);
    private questionService = inject(QuestionService);
    private answerService = inject(AnswerService);
    private userQuizService = inject(UserQuizService);
    private userQuestionService = inject(UserQuestionService);
    private xpService = inject(XpService);

    protected readonly quiz = signal<QuizModel | null>(null);
    protected readonly questions = signal<Question[]>([]);
    protected readonly currentAnswers = signal<Answer[]>([]);
    protected readonly currentIndex = signal(0);
    protected readonly selectedOptionId = signal<string | null>(null);
    protected readonly confirmed = signal(false);
    protected readonly finished = signal(false);
    protected readonly results = signal<QuizResult[]>([]);
    protected readonly spentTimeSeconds = signal(0);
    protected readonly isRevisionMode = signal<boolean>(false);
    protected readonly noQuestionsAvailable = signal<boolean>(false);

    private timerInterval: any;
    private userId: string | null = null;
    private currentAttempt: UserQuiz | null = null;

    protected readonly currentQuestion = computed(() => this.questions()[this.currentIndex()]);
    protected readonly selectedAnswer = computed(() => this.currentAnswers().find(a => a.id === this.selectedOptionId()));

    protected readonly progress = computed(() => this.currentIndex() + 1);
    protected readonly totalQuestions = computed(() => this.questions().length);

    protected readonly correctCount = computed(() => this.results().filter(r => r.correct).length);
    protected readonly wrongCount = computed(() => this.results().filter(r => !r.correct).length);

    protected readonly scorePercent = computed(() => {
        const total = this.totalQuestions();
        return total > 0 ? Math.round((this.correctCount() / total) * 100) : 0;
    });

    protected readonly scoreLabel = computed(() => `${this.correctCount()}/${this.totalQuestions()}`);

    protected readonly progressCircleCircumference = 2 * Math.PI * 88;
    protected readonly progressCircleDashoffset = computed(() =>
        Math.round(this.progressCircleCircumference * (1 - this.scorePercent() / 100))
    );

    protected readonly progressCircleFailureCircumference = 2 * Math.PI * 70;
    protected readonly progressCircleFailureDashoffset = computed(() =>
        Math.round(this.progressCircleFailureCircumference * (1 - this.scorePercent() / 100))
    );

    protected readonly passed = computed(() => this.scorePercent() >= 70);

    async ngOnInit() {
        const lessonId = this.route.snapshot.paramMap.get('lessonId');
        if (!lessonId) return;

        try {
            const user = await this.userService.getUserProfile();
            this.userId = user.id;

            const lesson = await this.lessonService.getLessonById(lessonId);
            if (!lesson) return;

            if (lesson.type === LessonType.REVISION) {
                const quizData = await this.quizService.getQuizByLessonId(lessonId);
                if (!quizData) return;
                this.isRevisionMode.set(true);

                const revisionQuestions = await this.quizService.getRevisionQuestions(lessonId, lesson.subModuleId);

                if (revisionQuestions.length === 0) {
                    this.noQuestionsAvailable.set(true);
                    return;
                }

                this.questions.set(revisionQuestions);
                await this.loadAnswersForCurrentQuestion();
                this.startTimer();

                this.currentAttempt = await this.userQuizService.createAttempt(this.userId, quizData.id);
            } else {
                const quizData = await this.quizService.getQuizByLessonId(lessonId);
                if (!quizData) return;
                this.quiz.set(quizData);

                let questionsData = await this.questionService.getQuestionsByQuizId(quizData.id);
                questionsData = this.shuffle(questionsData);
                this.questions.set(questionsData);

                if (questionsData.length > 0) {
                    await this.loadAnswersForCurrentQuestion();
                    this.startTimer();

                    // Opcional: criar tentativa inicial no banco
                    this.currentAttempt = await this.userQuizService.createAttempt(this.userId, quizData.id);
                }
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
        }
    }

    private startTimer() {
        this.timerInterval = setInterval(() => {
            this.spentTimeSeconds.update(s => s + 1);
        }, 1000);
    }

    private stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    protected async loadAnswersForCurrentQuestion() {
        const question = this.currentQuestion();
        if (!question) return;

        let answers = await this.answerService.getAnswersByQuestionId(question.id);
        answers = this.shuffle(answers);
        this.currentAnswers.set(answers);
    }

    protected answer(answerId: string) {
        if (this.confirmed()) return;
        this.selectedOptionId.set(answerId);
    }

    protected async confirmAnswer() {
        const selectedId = this.selectedOptionId();
        const question = this.currentQuestion();
        const selectedAnswer = this.selectedAnswer();

        if (!selectedId || !question || !selectedAnswer || this.confirmed() || this.finished()) {
            return;
        }

        const isCorrect = selectedAnswer.isCorrect;

        this.results.update(r => [...r, {
            questionId: question.id,
            correct: isCorrect,
            answerId: selectedId
        }]);

        // Persist question result
        if (this.userId) {
            await this.userQuestionService.saveUserQuestion({
                userId: this.userId,
                questionId: question.id,
                answerId: selectedId,
                isCorrect: isCorrect
            });
        }

        this.confirmed.set(true);
    }

    protected async next() {
        if (!this.confirmed() || this.finished()) return;

        if (this.currentIndex() < this.totalQuestions() - 1) {
            this.currentIndex.update(i => i + 1);
            this.selectedOptionId.set(null);
            this.confirmed.set(false);
            await this.loadAnswersForCurrentQuestion();
        } else {
            await this.finishQuiz();
        }
    }

    private async finishQuiz() {
        this.stopTimer();
        this.finished.set(true);

        const lessonId = this.route.snapshot.paramMap.get('lessonId');

        if (this.currentAttempt && lessonId) {
            try {
                await this.quizService.completeQuiz(
                    this.currentAttempt.id,
                    lessonId,
                    this.correctCount(),
                    this.totalQuestions(),
                    this.spentTimeSeconds()
                );
                await this.xpService.refreshXp();
            } catch (error) {
                console.error('Error completing quiz via Edge Function:', error);
            }
        }
    }

    protected restart() {
        this.currentIndex.set(0);
        this.selectedOptionId.set(null);
        this.confirmed.set(false);
        this.finished.set(false);
        this.results.set([]);
        this.spentTimeSeconds.set(0);
        this.questions.update(q => this.shuffle(q));
        this.loadAnswersForCurrentQuestion();
        this.startTimer();
    }

    private shuffle<T>(array: T[]): T[] {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    protected formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
