import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StudentProgressService } from '../../../services/student-progress';
import { TrackService } from '../../../services/track';
import { Tracks } from './tracks';

describe('Tracks page', () => {
    let fixture: ComponentFixture<Tracks>;
    let trackService: jasmine.SpyObj<TrackService>;
    let progressService: jasmine.SpyObj<StudentProgressService>;

    const course = (id: string, inRevision = false) => ({ id, slug: id, title: `Curso ${id}`, description: '', inRevision });
    const track = (id: string, courses: ReturnType<typeof course>[]) =>
        ({ id, slug: id, title: `Trilha ${id}`, description: 'Desc', icon: null, order: 1, published: true, courses });

    async function render() {
        fixture = TestBed.createComponent(Tracks);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    }

    beforeEach(() => {
        trackService = jasmine.createSpyObj('TrackService', ['getPublishedTracks']);
        progressService = jasmine.createSpyObj('StudentProgressService', ['load']);
        progressService.load.and.resolveTo({ userCourses: [], userLessons: [], lessons: [] });
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: TrackService, useValue: trackService },
                { provide: StudentProgressService, useValue: progressService },
            ],
        });
    });

    it('links each track and counts completed courses, ignoring hidden ones', async () => {
        trackService.getPublishedTracks.and.resolveTo([track('t1', [course('c1'), course('c2'), course('c3', true)])]);
        progressService.load.and.resolveTo({ userCourses: [{ module_id: 'c1', completed: true }], userLessons: [], lessons: [] });

        const el = await render();

        expect(el.querySelector('a')!.getAttribute('href')).toBe('/app/trilhas/t1');
        expect(el.textContent).toContain('1 de 2 cursos concluídos');
    });

    it('shows an empty message when there are no tracks', async () => {
        trackService.getPublishedTracks.and.resolveTo([]);

        expect((await render()).textContent).toContain('Nenhuma trilha disponível');
    });

    it('announces load failures', async () => {
        trackService.getPublishedTracks.and.rejectWith(new Error('falhou'));

        expect((await render()).querySelector('[role="alert"]')!.textContent).toContain('falhou');
    });
});
