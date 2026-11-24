import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrackWithCourses } from '../../../../models/track/track';
import { StudentProgressService } from '../../../services/student-progress';
import { TrackService } from '../../../services/track';
import { courseProgress, ProgressSources } from '../../../utils/course-progress';

@Component({
    selector: 'app-track-detail',
    imports: [RouterLink],
    templateUrl: './track-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackDetail implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly trackService = inject(TrackService);
    private readonly progressService = inject(StudentProgressService);

    protected readonly track = signal<TrackWithCourses | null>(null);
    private readonly progress = signal<ProgressSources>({ userCourses: [], userLessons: [], lessons: [] });

    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly items = computed(() =>
        (this.track()?.courses ?? []).map(course => ({
            course,
            progress: courseProgress(course.id, this.progress()),
            comingSoon: course.inRevision,
        }))
    );

    async ngOnInit(): Promise<void> {
        try {
            const slug = this.route.snapshot.paramMap.get('slug') ?? '';
            const [track, progress] = await Promise.all([this.trackService.getTrackBySlug(slug), this.progressService.load()]);
            if (!track) {
                this.error.set('Trilha não encontrada.');
                return;
            }
            this.track.set(track);
            this.progress.set(progress);
        } catch (err) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar a trilha.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
