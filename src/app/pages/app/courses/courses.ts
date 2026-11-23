import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Course } from '../../../../models/course/course';
import { UserCourse } from '../../../../models/user-course/user-course';
import { CourseService } from '../../../services/course';
import { UserCourseService } from '../../../services/user-course';
import { LessonService } from '../../../services/lesson';
import { UserLessonService } from '../../../services/user-lesson';
import { RankingWeeklyService } from '../../../services/ranking-weekly';
import { UserService } from '../../../services/user';
import { Lesson } from '../../../../models/lesson/lesson';
import { UserLesson } from '../../../../models/user-lesson/user-lesson';
import { RankingEntry } from '../../../../models/ranking/ranking';

type ProgressState = 'not-started' | 'in-progress' | 'completed';

interface CourseWithState {
    course: Course;
    progressState: ProgressState;
    progressPercentage: number;
}

@Component({
    selector: 'app-courses',
    imports: [RouterLink, DecimalPipe],
    templateUrl: './courses.html',
    styleUrls: ['./courses.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Courses implements OnInit {
    private readonly courseService = inject(CourseService);
    private readonly userCourseService = inject(UserCourseService);
    private readonly lessonService = inject(LessonService);
    private readonly userLessonService = inject(UserLessonService);
    private readonly rankingWeeklyService = inject(RankingWeeklyService);
    protected readonly userService = inject(UserService);
    private readonly router = inject(Router);

    protected readonly courses = signal<Course[]>([]);
    protected readonly userCourses = signal<any[]>([]);
    protected readonly allLessons = signal<{ id: string; moduleId: string; courseId: string }[]>([]);
    protected readonly userLessons = signal<any[]>([]);
    
    protected readonly podiumUsers = signal<RankingEntry[]>([]);
    protected readonly currentUserPosition = signal<number | null>(null);
    protected readonly currentUserXp = signal<number>(0);

    protected readonly isLoading = signal<boolean>(true);
    protected readonly error = signal<string | null>(null);

    protected readonly coursesWithState = computed<CourseWithState[]>(() => {
        const userCourseMap = new Map<string, any>(
            this.userCourses().map((um) => [um.module_id || um.course?.id, um])
        );

        return this.courses().map((course) => {
            const userCourse = userCourseMap.get(course.id);
            let progressState: ProgressState = 'not-started';
            let progressPercentage = 0;

            if (userCourse) {
                progressState = userCourse.completed ? 'completed' : 'in-progress';
                
                if (progressState === 'completed') {
                    progressPercentage = 100;
                } else {
                    const courseLessons = this.allLessons().filter(l => l.courseId === course.id);
                    if (courseLessons.length > 0) {
                        const completedCount = this.userLessons().filter(ul => 
                            ul.completed && courseLessons.some(l => l.id === (ul.lesson?.id || ul.lesson_id))
                        ).length;
                        progressPercentage = Math.round((completedCount / courseLessons.length) * 100);
                    }
                }
            }

            return { course, progressState, progressPercentage };
        });
    });

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            this.isLoading.set(true);

            let userId = this.userService.currentUser()?.id;
            if (!userId) {
                await this.userService.loadUserProfile();
                userId = this.userService.currentUser()?.id;
            }
            if (!userId) {
                throw new Error('Usuário não autenticado.');
            }

            const [courses, userCourses, userLessons, rankingResult, lightweightLessons] = await Promise.all([
                this.courseService.getCoursesForDisplay(),
                this.userCourseService.getUserCoursesForUser(userId),
                this.userLessonService.getUserLessonsForUser(userId),
                this.rankingWeeklyService.getRanking(),
                this.lessonService.getLessonsLightweight()
            ]);

            this.courses.set(courses.filter(m => !m.inRevision));
            this.userCourses.set(userCourses);
            this.userLessons.set(userLessons);
            this.allLessons.set(lightweightLessons);

            // Ranking data
            this.podiumUsers.set(rankingResult.ranking.slice(0, 3));
            this.currentUserPosition.set(rankingResult.currentUser.position);
            this.currentUserXp.set(rankingResult.currentUser.xp);

        } catch (err) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar os cursos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async onStartCourse(courseId: string, slug: string): Promise<void> {
        try {
            await this.userCourseService.startCourse(courseId);
            await this.router.navigate(['/app/c', slug]);
        } catch (err) {
            console.error('Erro ao iniciar curso:', err);
        }
    }
}
