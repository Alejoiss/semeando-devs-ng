import { TestBed } from '@angular/core/testing';
import { createQueryStub, StubResult } from '../../testing/query-stub';
import { SupabaseService } from './supabase';
import { TrackService } from './track';

describe('TrackService', () => {
    let service: TrackService;
    let fromSpy: jasmine.Spy;

    function respondWith(result: StubResult) {
        const stub = createQueryStub(result);
        fromSpy.and.returnValue(stub.query);
        return stub;
    }

    beforeEach(() => {
        fromSpy = jasmine.createSpy('from');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { from: fromSpy } } }],
        });
        service = TestBed.inject(TrackService);
    });

    const row = {
        id: 't1', slug: 'backend', title: 'Backend', description: '', icon: null, order: 1, published: true,
        track_courses: [
            { position: 2, course: { id: 'c2', title: 'Testes', in_revision: false } },
            { position: 1, course: { id: 'c1', title: 'Git', in_revision: true } },
            { position: 3, course: null },
        ],
    };

    it('lists published tracks with courses ordered by position inside each track', async () => {
        const stub = respondWith({ data: [row] });

        const [track] = await service.getPublishedTracks();

        expect(fromSpy).toHaveBeenCalledWith('tracks');
        expect(stub.spy('eq')).toHaveBeenCalledWith('published', true);
        expect(track.courses.map(c => c.id)).toEqual(['c1', 'c2']);
        expect(track.courses[0].inRevision).toBeTrue();
    });

    it('returns null when the slug has no published track', async () => {
        respondWith({ data: null });

        expect(await service.getTrackBySlug('nope')).toBeNull();
    });

    it('lists the tracks of a course ordered by track order', async () => {
        respondWith({
            data: [
                { track: { id: 'b', slug: 'b', title: 'B', order: 2 } },
                { track: { id: 'a', slug: 'a', title: 'A', order: 1 } },
            ],
        });

        expect(await service.getTracksForCourse('c1')).toEqual([
            { id: 'a', slug: 'a', title: 'A' },
            { id: 'b', slug: 'b', title: 'B' },
        ]);
    });

    it('replaces the track courses with sequential positions', async () => {
        const stub = respondWith({});

        await service.setTrackCourses('t1', ['c3', 'c1']);

        expect(fromSpy.calls.allArgs()).toEqual([['track_courses'], ['track_courses']]);
        expect(stub.spy('delete')).toHaveBeenCalled();
        expect(stub.spy('insert')).toHaveBeenCalledWith([
            { track_id: 't1', module_id: 'c3', position: 1 },
            { track_id: 't1', module_id: 'c1', position: 2 },
        ]);
    });

    it('only clears the association when no courses are given', async () => {
        const stub = respondWith({});

        await service.setTrackCourses('t1', []);

        expect(stub.spy('insert')).not.toHaveBeenCalled();
    });

    it('surfaces database errors', async () => {
        respondWith({ error: { message: 'boom' } });

        await expectAsync(service.getAllTracks()).toBeRejectedWithError('boom');
    });
});
