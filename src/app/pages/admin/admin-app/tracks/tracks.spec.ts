import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourseService } from '../../../../services/course';
import { TrackService } from '../../../../services/track';
import { AdminTracks } from './tracks';

describe('AdminTracks page', () => {
    let fixture: ComponentFixture<AdminTracks>;
    let trackService: jasmine.SpyObj<TrackService>;

    const course = (id: string) => ({ id, slug: id, title: `Curso ${id}`, description: '', inRevision: false });
    const existing = {
        id: 't1', slug: 'backend', title: 'Backend', description: 'Desc', icon: null, order: 3, published: false,
        courses: [course('c1'), course('c2')],
    };

    const el = () => fixture.nativeElement as HTMLElement;
    const click = (label: string) =>
        (Array.from(el().querySelectorAll('button')).find(b => (b.getAttribute('aria-label') ?? b.textContent!).includes(label)) as HTMLButtonElement).click();
    const type = (selector: string, value: string) => {
        const input = el().querySelector(selector) as HTMLInputElement;
        input.value = value;
        input.dispatchEvent(new Event('input'));
    };
    async function settle() {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    beforeEach(async () => {
        trackService = jasmine.createSpyObj('TrackService', ['getAllTracks', 'createTrack', 'updateTrack', 'deleteTrack', 'setTrackCourses']);
        trackService.getAllTracks.and.resolveTo([existing]);
        trackService.createTrack.and.resolveTo('new-id');
        trackService.updateTrack.and.resolveTo();
        trackService.setTrackCourses.and.resolveTo();
        const courseService = jasmine.createSpyObj('CourseService', ['getCoursesForDisplay']);
        courseService.getCoursesForDisplay.and.resolveTo([course('c1'), course('c2'), course('c3')]);
        TestBed.configureTestingModule({
            providers: [
                { provide: TrackService, useValue: trackService },
                { provide: CourseService, useValue: courseService },
            ],
        });
        fixture = TestBed.createComponent(AdminTracks);
        await settle();
    });

    it('lists tracks with publication state', () => {
        expect(el().textContent).toContain('Backend');
        expect(el().textContent).toContain('Oculta · 2 cursos');
    });

    it('creates a hidden track after the last one, with a slug derived from the title and the chosen course order', async () => {
        click('Nova trilha');
        await settle();
        type('#track-title', 'Dados e IA');
        const select = el().querySelector('#track-add-course') as HTMLSelectElement;
        for (const id of ['c3', 'c1']) {
            select.value = id;
            select.dispatchEvent(new Event('change'));
            await settle();
        }
        click('Salvar');
        await settle();

        expect(trackService.createTrack).toHaveBeenCalledWith(
            { title: 'Dados e IA', slug: 'dados-e-ia', description: '', icon: null, published: false },
            4,
        );
        expect(trackService.setTrackCourses).toHaveBeenCalledWith('new-id', ['c3', 'c1']);
    });

    it('reorders courses of an existing track before saving', async () => {
        click('Editar');
        await settle();
        click('Mover Curso c2 para cima');
        await settle();
        click('Salvar');
        await settle();

        expect(trackService.updateTrack).toHaveBeenCalled();
        expect(trackService.setTrackCourses).toHaveBeenCalledWith('t1', ['c2', 'c1']);
    });

    it('does not save an invalid form', async () => {
        click('Nova trilha');
        await settle();
        click('Salvar');
        await settle();

        expect(trackService.createTrack).not.toHaveBeenCalled();
        expect(el().textContent).toContain('Informe o título');
    });

    it('shows a friendly message for a duplicated slug', async () => {
        trackService.updateTrack.and.rejectWith(new Error('duplicate key value violates unique constraint'));
        click('Editar');
        await settle();
        click('Salvar');
        await settle();

        expect(el().querySelector('[role="alert"]')!.textContent).toContain('Já existe uma trilha');
    });
});
