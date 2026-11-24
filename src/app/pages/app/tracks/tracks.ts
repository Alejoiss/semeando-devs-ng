import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrackWithCourses } from '../../../../models/track/track';
import { StudentProgressService } from '../../../services/student-progress';
import { TrackService } from '../../../services/track';
import { courseProgress, ProgressSources } from '../../../utils/course-progress';

interface TrackCard {
    track: TrackWithCourses;
    courseCount: number;
    completedCount: number;
    percentage: number;
}

@Component({
    selector: 'app-tracks',
    imports: [RouterLink],
    templateUrl: './tracks.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tracks implements OnInit {
    private readonly trackService = inject(TrackService);
    private readonly progressService = inject(StudentProgressService);

    private readonly tracks = signal<TrackWithCourses[]>([]);
    private readonly progress = signal<ProgressSources>({ userCourses: [], userLessons: [], lessons: [] });

    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);

    protected readonly cards = computed<TrackCard[]>(() =>
        this.tracks().map(track => {
            const courses = track.courses.filter(c => !c.inRevision);
            const percentages = courses.map(c => courseProgress(c.id, this.progress()));
            const completedCount = percentages.filter(p => p.state === 'completed').length;
            const total = percentages.reduce((sum, p) => sum + p.percentage, 0);
            return {
                track: { ...track, courses },
                courseCount: courses.length,
                completedCount,
                percentage: courses.length ? Math.round(total / courses.length) : 0,
            };
        })
    );

    async ngOnInit(): Promise<void> {
        try {
            const [tracks, progress] = await Promise.all([this.trackService.getPublishedTracks(), this.progressService.load()]);
            this.tracks.set(tracks);
            this.progress.set(progress);
        } catch (err) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar as trilhas.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
