import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Course } from '../../../../../models/course/course';
import { TrackWithCourses } from '../../../../../models/track/track';
import { CourseService } from '../../../../services/course';
import { TrackService } from '../../../../services/track';
import { slugify } from '../../../../utils/slug';

@Component({
    selector: 'app-admin-tracks',
    imports: [ReactiveFormsModule],
    templateUrl: './tracks.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTracks implements OnInit {
    private readonly trackService = inject(TrackService);
    private readonly courseService = inject(CourseService);

    protected readonly tracks = signal<TrackWithCourses[]>([]);
    protected readonly allCourses = signal<Course[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly loadError = signal<string | null>(null);

    protected readonly editing = signal<TrackWithCourses | 'new' | null>(null);
    protected readonly selectedCourseIds = signal<string[]>([]);
    protected readonly isSaving = signal(false);
    protected readonly saveError = signal<string | null>(null);

    protected readonly form = new FormGroup({
        title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        slug: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)] }),
        description: new FormControl('', { nonNullable: true }),
        icon: new FormControl('', { nonNullable: true }),
        published: new FormControl(false, { nonNullable: true }),
    });

    protected readonly selectedCourses = computed(() => {
        const byId = new Map(this.allCourses().map(c => [c.id, c]));
        return this.selectedCourseIds().map(id => byId.get(id)).filter((c): c is Course => !!c);
    });

    protected readonly availableCourses = computed(() => {
        const selected = new Set(this.selectedCourseIds());
        return this.allCourses().filter(c => !selected.has(c.id));
    });

    async ngOnInit(): Promise<void> {
        await this.load();
    }

    private async load(): Promise<void> {
        this.isLoading.set(true);
        this.loadError.set(null);
        try {
            const [tracks, courses] = await Promise.all([this.trackService.getAllTracks(), this.courseService.getCoursesForDisplay()]);
            this.tracks.set(tracks);
            this.allCourses.set(courses);
        } catch (err) {
            this.loadError.set(err instanceof Error ? err.message : 'Não foi possível carregar as trilhas.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected onTitleInput(): void {
        if (this.editing() === 'new') {
            this.form.controls.slug.setValue(slugify(this.form.controls.title.value));
        }
    }

    protected startNew(): void {
        this.form.reset({ title: '', slug: '', description: '', icon: '', published: false });
        this.selectedCourseIds.set([]);
        this.saveError.set(null);
        this.editing.set('new');
    }

    protected startEdit(track: TrackWithCourses): void {
        this.form.reset({
            title: track.title,
            slug: track.slug,
            description: track.description,
            icon: track.icon ?? '',
            published: track.published,
        });
        this.selectedCourseIds.set(track.courses.map(c => c.id));
        this.saveError.set(null);
        this.editing.set(track);
    }

    protected cancel(): void {
        this.editing.set(null);
    }

    protected addCourse(courseId: string): void {
        if (courseId) {
            this.selectedCourseIds.update(ids => [...ids, courseId]);
        }
    }

    protected removeCourse(courseId: string): void {
        this.selectedCourseIds.update(ids => ids.filter(id => id !== courseId));
    }

    protected moveCourse(index: number, delta: -1 | 1): void {
        this.selectedCourseIds.update(ids => {
            const target = index + delta;
            if (target < 0 || target >= ids.length) {
                return ids;
            }
            const next = [...ids];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    protected showError(control: 'title' | 'slug'): boolean {
        const c = this.form.controls[control];
        return c.invalid && (c.touched || c.dirty);
    }

    protected async save(): Promise<void> {
        const current = this.editing();
        if (!current || this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        const payload = {
            title: raw.title.trim(),
            slug: raw.slug,
            description: raw.description.trim(),
            icon: raw.icon.trim() || null,
            published: raw.published,
        };

        this.isSaving.set(true);
        this.saveError.set(null);
        try {
            let trackId: string;
            if (current === 'new') {
                const nextOrder = Math.max(0, ...this.tracks().map(t => t.order)) + 1;
                trackId = await this.trackService.createTrack(payload, nextOrder);
            } else {
                trackId = current.id;
                await this.trackService.updateTrack(trackId, payload);
            }
            await this.trackService.setTrackCourses(trackId, this.selectedCourseIds());
            this.editing.set(null);
            await this.load();
        } catch (err) {
            this.saveError.set(this.describeError(err));
        } finally {
            this.isSaving.set(false);
        }
    }

    protected async remove(track: TrackWithCourses): Promise<void> {
        if (!confirm(`Excluir a trilha "${track.title}"? Os cursos não são afetados.`)) {
            return;
        }
        try {
            await this.trackService.deleteTrack(track.id);
            await this.load();
        } catch (err) {
            this.loadError.set(this.describeError(err));
        }
    }

    private describeError(err: unknown): string {
        const message = err instanceof Error ? err.message : '';
        return message.includes('duplicate key') ? 'Já existe uma trilha com esse endereço (slug).' : message || 'Não foi possível salvar a trilha.';
    }
}
