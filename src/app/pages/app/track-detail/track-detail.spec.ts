import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { StudentProgressService } from '../../../services/student-progress';
import { TrackService } from '../../../services/track';
import { TrackDetail } from './track-detail';

describe('TrackDetail page', () => {
    let fixture: ComponentFixture<TrackDetail>;
    let trackService: jasmine.SpyObj<TrackService>;

    const course = (id: string, inRevision = false) => ({ id, slug: `slug-${id}`, title: `Curso ${id}`, description: '', inRevision });

    async function render() {
        fixture = TestBed.createComponent(TrackDetail);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    beforeEach(() => {
        trackService = jasmine.createSpyObj('TrackService', ['getTrackBySlug']);
        const progress = jasmine.createSpyObj('StudentProgressService', ['load']);
        progress.load.and.resolveTo({
            userCourses: [{ module_id: 'c1', completed: false }],
            lessons: [{ id: 'l1', courseId: 'c1' }, { id: 'l2', courseId: 'c1' }],
            userLessons: [{ completed: true, lesson_id: 'l1' }],
        });
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ slug: 'backend' }) } } },
                { provide: TrackService, useValue: trackService },
                { provide: StudentProgressService, useValue: progress },
            ],
        });
    });

    it('lists courses in order with progress and marks unpublished ones as coming soon', async () => {
        trackService.getTrackBySlug.and.resolveTo({
            id: 't', slug: 'backend', title: 'Backend', description: 'Desc', icon: null, order: 1, published: true,
            courses: [course('c1'), course('c2', true)],
        });

        const el = await render();
        const items = el.querySelectorAll('ol > li');

        expect(items[0].textContent).toContain('Curso c1');
        expect(items[0].textContent).toContain('50% concluído');
        expect(items[0].querySelector('a')!.getAttribute('href')).toBe('/app/c/slug-c1');
        expect(items[1].textContent).toContain('Em breve');
        expect(items[1].querySelector('a')).toBeNull();
    });

    it('reports a missing track', async () => {
        trackService.getTrackBySlug.and.resolveTo(null);

        expect((await render()).querySelector('[role="alert"]')!.textContent).toContain('Trilha não encontrada');
    });
});
