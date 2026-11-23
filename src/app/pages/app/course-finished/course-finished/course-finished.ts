import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../../../services/course';
import { AchievementsService } from '../../../../services/achievements';
import { UserCourseService } from '../../../../services/user-course';
import { Course } from '../../../../../models/course/course';
import { Achievements } from '../../../../../models/achievements/achievements';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-course-finished',
    imports: [CommonModule, RouterLink],
    templateUrl: './course-finished.html',
    styleUrl: './course-finished.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseFinished implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private courseService = inject(CourseService);
    private achievementsService = inject(AchievementsService);
    private userCourseService = inject(UserCourseService);

    protected readonly isLoading = signal<boolean>(true);
    protected readonly course = signal<Course | null>(null);
    protected readonly courseAchievement = signal<Achievements | null>(null);

    protected readonly earnedSeeds = computed(() =>
        Math.ceil((this.courseAchievement()?.xpAmount ?? 0) * 0.1)
    );

    async ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('slug');

        if (!slug) {
            this.router.navigate(['/app']);
            return;
        }

        try {
            const [mod, allAchievements] = await Promise.all([
                this.courseService.getCourseBySlug(slug),
                this.achievementsService.getAchievements(),
            ]);

            if (!mod) {
                this.isLoading.set(false);
                return;
            }

            // Guard: only show this screen if the course is actually completed
            const completed = await this.userCourseService.isCourseCompleted(mod.id);
            if (!completed) {
                this.router.navigate(['/app']);
                return;
            }

            this.course.set(mod);

            const matched = allAchievements.find(
                (a) => a.courseId === mod.id
            ) ?? null;
            this.courseAchievement.set(matched);
        } catch {
            this.course.set(null);
        } finally {
            this.isLoading.set(false);
        }
    }
}
