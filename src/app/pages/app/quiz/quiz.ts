import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { Answer } from '../../../../models/answer/answer';
import { Question } from '../../../../models/question/question';
import { Quiz as QuizModel } from '../../../../models/quiz/quiz';
import { Lesson, LessonType } from '../../../../models/lesson/lesson';
import { UserQuiz } from '../../../../models/user-quiz/user-quiz';
import { AnswerService } from '../../../services/answer';
import { LessonService } from '../../../services/lesson';
import { QuestionService } from '../../../services/question';
import { QuizService } from '../../../services/quiz';
import { UserService } from '../../../services/user';
import { UserQuestionService } from '../../../services/user-question';
import { UserQuizService } from '../../../services/user-quiz';
import { XpService } from '../../../services/xp';
import { SeedService } from '../../../services/seed';
import { AchievementsService } from '../../../services/achievements';
import { DailyLimitService } from '../../../services/daily-limit/daily-limit';
import { MarkdownModule } from 'ngx-markdown';
import { MotionReveal } from '../../../directives/motion-reveal';
import { BrandLoader } from '../../../components/brand-loader/brand-loader';
import { ResultIllustration } from '../../../components/result-illustration/result-illustration';
import { CountUp } from '../../../directives/count-up';
import { loadGsap, prefersReducedMotion } from '../../../utils/motion';
import { QuizReview, QuizReviewItem } from './quiz-review/quiz-review';
import { summarizeQuestion } from './quiz-review/quiz-summary';

type LoadState = 'loading' | 'ready' | 'error';

// Tempo para a contagem de XP/Seeds terminar antes do modal de conquista aparecer por cima.
const ACHIEVEMENT_MODAL_DELAY_MS = 1800;

interface QuizResult {
    questionId: string;
    correct: boolean;
    answerId: string;
    reason?: string;
}

@Component({
    selector: 'app-quiz',
    standalone: true,
    imports: [MotionReveal, CommonModule, RouterLink, MarkdownModule, BrandLoader, ResultIllustration, CountUp, QuizReview],
    templateUrl: './quiz.html',
    styleUrls: ['./quiz.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(window:keydown)': 'handleKeyboardEvent($event)',
        '(window:beforeunload)': 'warnBeforeLosingResult($event)'
    }
})
export class Quiz implements OnInit {
    public route = inject(ActivatedRoute);
    private router = inject(Router);
    private userService = inject(UserService);
    private lessonService = inject(LessonService);
    private quizService = inject(QuizService);
    private questionService = inject(QuestionService);
    private answerService = inject(AnswerService);
    private userQuizService = inject(UserQuizService);
    private userQuestionService = inject(UserQuestionService);
    private xpService = inject(XpService);
    private seedService = inject(SeedService);
    private achievementsService = inject(AchievementsService);
    private dailyLimitService = inject(DailyLimitService);

    protected readonly lesson = signal<Lesson | null>(null);
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
    protected readonly isProcessingCompleteQuiz = signal<boolean>(false);
    protected readonly completionError = signal<boolean>(false);
    protected readonly loadState = signal<LoadState>('loading');
    protected readonly loadErrorMessage = signal<string>('');
    protected readonly quizCompletionResult = signal<any>(null);

    protected readonly isConfirming = signal<boolean>(false);
    protected readonly prefetchedAnswers = signal<{ questionId: string; answers: Answer[] } | null>(null);

    protected readonly totalSeeds = this.seedService.totalSeeds;
    protected readonly earnedSeeds = signal<number>(0);
    protected readonly showHintConfirm = signal(false);
    protected readonly hintVisible = signal(false);
    protected readonly questionHint = signal<string | null>(null);

    private timerInterval: any;
    private userId: string | null = null;
    private currentAttempt: UserQuiz | null = null;
    private achievementTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor() {
        inject(DestroyRef).onDestroy(() => {
            this.stopTimer();
            clearTimeout(this.achievementTimeout);
        });
    }

    protected readonly currentQuestion = computed(() => this.questions()[this.currentIndex()]);
    protected readonly selectedAnswer = computed(() => this.currentAnswers().find(a => a.id === this.selectedOptionId()));
    protected readonly correctReason = computed(() => this.questionHint());

    protected readonly progress = computed(() => this.currentIndex() + 1);
    protected readonly totalQuestions = computed(() => this.questions().length);
    protected readonly answeredCount = computed(() => this.results().length);
    protected readonly progressPercent = computed(() => {
        const total = this.totalQuestions();
        return total > 0 ? Math.round((this.answeredCount() / total) * 100) : 0;
    });

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

    protected readonly xpAwarded = computed(() => this.quizCompletionResult()?.xpAwarded || 0);

    protected readonly title = computed(() => this.isRevisionMode() ? 'Quiz de Revisão' : (this.lesson()?.title ?? 'Quiz'));

    // Aprovado só avança com o resultado salvo; reprovado volta para a lição e não depende dele.
    protected readonly continueBlocked = computed(() =>
        this.isProcessingCompleteQuiz() || (this.passed() && !this.quizCompletionResult())
    );

    protected warnBeforeLosingResult(event: BeforeUnloadEvent) {
        if (!this.finished() || this.quizCompletionResult()) return;
        event.preventDefault();
    }

    protected readonly reviewItems = computed<QuizReviewItem[]>(() => {
        const questionsById = new Map(this.questions().map(q => [q.id, q]));
        return this.results().map((result, i) => ({
            questionId: result.questionId,
            index: i + 1,
            correct: result.correct,
            title: summarizeQuestion(questionsById.get(result.questionId)),
            reason: result.correct ? undefined : result.reason,
        }));
    });

    ngOnInit() {
        void loadGsap();
        void this.load();
    }

    protected retryLoad() {
        void this.load();
    }

    private failLoad(message: string) {
        this.loadErrorMessage.set(message);
        this.loadState.set('error');
    }

    private async load() {
        const lessonId = this.route.snapshot.paramMap.get('lessonId');
        if (!lessonId) {
            this.failLoad('Não encontramos esta lição.');
            return;
        }

        this.loadState.set('loading');

        try {
            const [user, lesson] = await Promise.all([
                this.userService.getUserProfile(),
                this.lessonService.getLessonById(lessonId),
            ]);
            this.userId = user.id;

            if (!lesson) {
                this.failLoad('Não encontramos esta lição.');
                return;
            }
            this.lesson.set(lesson);

            let quizId: string;

            if (lesson.type === LessonType.REVISION) {
                const [quizData, revisionQuestions] = await Promise.all([
                    this.quizService.getOrCreateQuiz(lessonId),
                    this.quizService.getRevisionQuestions(lessonId, lesson.moduleId),
                ]);
                this.isRevisionMode.set(true);

                if (revisionQuestions.length === 0) {
                    this.noQuestionsAvailable.set(true);
                    this.loadState.set('ready');
                    return;
                }

                this.questions.set(revisionQuestions);
                quizId = quizData.id;
            } else {
                const quizData = await this.quizService.getQuizByLessonId(lessonId);
                if (!quizData) {
                    this.failLoad('Esta lição ainda não tem um quiz.');
                    return;
                }

                const questionsData = await this.questionService.getQuestionsByQuizId(quizData.id);
                if (questionsData.length === 0) {
                    this.failLoad('Este quiz ainda não tem questões.');
                    return;
                }

                this.quiz.set(quizData);
                this.questions.set(this.shuffle(questionsData));
                quizId = quizData.id;
            }

            await Promise.all([
                this.loadAnswersForCurrentQuestion(),
                this.currentAttempt
                    ? Promise.resolve()
                    : this.userQuizService.createAttempt(user.id, quizId).then(attempt => { this.currentAttempt = attempt; }),
            ]);

            this.loadState.set('ready');
            this.startTimer();
        } catch (error) {
            console.error('Error loading quiz:', error);
            this.failLoad('Verifique sua conexão e tente novamente.');
        }
    }

    private startTimer() {
        this.stopTimer();
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

        const prefetched = this.prefetchedAnswers();
        if (prefetched && prefetched.questionId === question.id) {
            this.currentAnswers.set(prefetched.answers);
            this.prefetchedAnswers.set(null);
            return;
        }

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

        if (!selectedId || !question || !selectedAnswer || this.confirmed() || this.finished() || this.isConfirming()) {
            return;
        }

        this.isConfirming.set(true);

        try {
            const verification = await this.answerService.verifyAnswer(selectedId);
            const isCorrect = verification.isCorrect;

            this.currentAnswers.update(answers =>
                answers.map(a =>
                    a.id === selectedId
                        ? { ...a, isCorrect: isCorrect, reason: verification.reason }
                        : a
                )
            );

            this.results.update(r => [...r, {
                questionId: question.id,
                correct: isCorrect,
                answerId: selectedId,
                reason: verification.reason
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

            const nextIndex = this.currentIndex() + 1;
            if (nextIndex < this.totalQuestions()) {
                const nextQuestionId = this.questions()[nextIndex].id;
                this.answerService.getAnswersByQuestionId(nextQuestionId).then(answers => {
                    this.prefetchedAnswers.set({ questionId: nextQuestionId, answers: this.shuffle(answers) });
                }).catch(err => {
                    console.error('Error prefetching answers:', err);
                });
            }
        } catch (error) {
            console.error('Error confirming answer:', error);
        } finally {
            this.isConfirming.set(false);
        }
    }

    protected async next() {
        if (!this.confirmed() || this.finished()) return;

        if (this.currentIndex() < this.totalQuestions() - 1) {
            this.currentIndex.update(i => i + 1);
            this.selectedOptionId.set(null);
            this.confirmed.set(false);
            this.hintVisible.set(false);
            this.showHintConfirm.set(false);
            this.questionHint.set(null);
            await this.loadAnswersForCurrentQuestion();
        } else {
            await this.finishQuiz();
        }
    }

    private async finishQuiz() {
        this.stopTimer();
        this.finished.set(true);
        await this.submitResult();
    }

    protected async submitResult() {
        const lessonId = this.route.snapshot.paramMap.get('lessonId');
        if (!this.currentAttempt || !lessonId || this.isProcessingCompleteQuiz()) return;

        this.completionError.set(false);
        this.isProcessingCompleteQuiz.set(true);

        try {
            const result = await this.quizService.completeQuiz(
                this.currentAttempt.id,
                lessonId,
                this.correctCount(),
                this.totalQuestions(),
                this.spentTimeSeconds()
            );
            this.quizCompletionResult.set(result);
            await this.creditEarnedSeeds(result);
        } catch (error) {
            console.error('Error completing quiz via Edge Function:', error);
            this.completionError.set(true);
            return;
        } finally {
            this.isProcessingCompleteQuiz.set(false);
        }

        this.refreshAfterCompletion();
    }

    private async creditEarnedSeeds(result: { xpAwarded?: number }) {
        if (!this.passed() || (result.xpAwarded ?? 0) <= 15) return;

        try {
            const amount = Math.ceil((result.xpAwarded ?? 0) * 0.1);
            await this.seedService.creditSeeds(amount);
            this.earnedSeeds.set(amount);
        } catch (error) {
            console.error('Error crediting seeds:', error);
        }
    }

    // Nada aqui bloqueia a tela: o resultado já está visível quando isso roda.
    private refreshAfterCompletion() {
        this.xpService.refreshXp().catch(console.error);

        if (this.userId) {
            this.dailyLimitService.loadDailyCount(this.userId).catch(console.error);
        }

        clearTimeout(this.achievementTimeout);
        this.achievementTimeout = setTimeout(
            () => void this.achievementsService.checkUnseenAchievements(),
            prefersReducedMotion() ? 0 : ACHIEVEMENT_MODAL_DELAY_MS
        );
    }

    protected requestHint() {
        if (this.confirmed() || this.finished() || this.totalSeeds() < 50) return;
        this.showHintConfirm.set(true);
    }

    protected cancelHint() {
        this.showHintConfirm.set(false);
    }

    protected async confirmHint() {
        if (this.confirmed() || this.finished() || this.totalSeeds() < 50) return;

        try {
            const success = await this.seedService.spendSeeds(50);
            if (success) {
                const hint = await this.answerService.getQuestionHint(this.currentQuestion().id);
                this.questionHint.set(hint);
                this.hintVisible.set(true);
                this.showHintConfirm.set(false);
            }
        } catch (error) {
            console.error('Error confirming hint:', error);
        }
    }

    protected restart() {
        if (this.isProcessingCompleteQuiz()) return;

        this.quizCompletionResult.set(null);
        this.completionError.set(false);
        this.currentIndex.set(0);
        this.selectedOptionId.set(null);
        this.confirmed.set(false);
        this.finished.set(false);
        this.results.set([]);
        this.spentTimeSeconds.set(0);
        this.earnedSeeds.set(0);
        this.hintVisible.set(false);
        this.showHintConfirm.set(false);
        this.questionHint.set(null);
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

    protected handleKeyboardEvent(event: KeyboardEvent) {
        if (this.loadState() !== 'ready' || this.finished() || this.noQuestionsAvailable()) return;

        const key = event.key.toLowerCase();

        // Shortcuts for options (a, b, c, d, 1, 2, 3, 4)
        const optionKeys = ['a', 'b', 'c', 'd', '1', '2', '3', '4'];
        let index = optionKeys.indexOf(key);

        if (index !== -1) {
            if (index >= 4) {
                index = index - 4;
            }

            const option = this.currentAnswers()[index];
            if (option) this.answer(option.id);
            return;
        }

        // Shortcut for Enter (Confirm or Next)
        if (event.key === 'Enter') {
            if (this.isConfirming() || this.isProcessingCompleteQuiz()) return;
            
            if (this.confirmed()) {
                this.next();
            } else if (this.selectedOptionId()) {
                this.confirmAnswer();
            }
        }
    }

    protected continueQuiz() {
        if (this.isProcessingCompleteQuiz()) return;

        const slug = this.route.snapshot.params['slug'];
        const slugModule = this.route.snapshot.params['slugModule'];
        const lessonId = this.route.snapshot.paramMap.get('lessonId');

        if (!this.passed()) {
            this.router.navigate(['/app/c', slug, 'm', slugModule, 'lesson', lessonId]);
            return;
        }

        const result = this.quizCompletionResult();
        if (!result) return; // Still processing or failed to process

        this.achievementsService.checkUnseenAchievements();

        if (result.courseCompleted) {
            this.router.navigate(['/app/c', slug, 'finished']);
        } else if (result.moduleCompleted) {
            this.router.navigate(['/app/c', slug]);
        } else {
            this.router.navigate(['/app/c', slug, 'm', slugModule]);
        }
    }
}
