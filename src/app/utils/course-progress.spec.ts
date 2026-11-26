import { courseProgress, ProgressSources } from './course-progress';

describe('courseProgress', () => {
    const lessons = [
        { id: 'l1', courseId: 'c1' },
        { id: 'l2', courseId: 'c1' },
        { id: 'l3', courseId: 'c2' },
    ];
    const sources = (over: Partial<ProgressSources> = {}): ProgressSources => ({ userCourses: [], lessons, userLessons: [], ...over });

    it('is not started when the student never started the course', () => {
        expect(courseProgress('c1', sources())).toEqual({ state: 'not-started', percentage: 0 });
    });

    it('is completed at 100% when the course is marked completed', () => {
        expect(courseProgress('c1', sources({ userCourses: [{ module_id: 'c1', completed: true }] }))).toEqual({ state: 'completed', percentage: 100 });
    });

    it('counts only completed lessons of that course', () => {
        const result = courseProgress('c1', sources({
            userCourses: [{ module_id: 'c1', completed: false }],
            userLessons: [
                { completed: true, lesson_id: 'l1' },
                { completed: false, lesson_id: 'l2' },
                { completed: true, lesson: { id: 'l3' } },
            ],
        }));
        expect(result).toEqual({ state: 'in-progress', percentage: 50 });
    });

    it('stays at 0% while in progress with no lessons', () => {
        expect(courseProgress('c9', sources({ userCourses: [{ module_id: 'c9', completed: false }] }))).toEqual({ state: 'in-progress', percentage: 0 });
    });

    describe('over every module of the course', () => {
        const modules = [
            { id: 'a', courseId: 'c1', published: true },
            { id: 'b', courseId: 'c1', published: true },
            { id: 'c', courseId: 'c1', published: false },
            { id: 'd', courseId: 'c1', published: false },
            { id: 'x', courseId: 'c2', published: true },
        ];
        const moduleLessons = [
            { id: 'a1', courseId: 'c1', moduleId: 'a' },
            { id: 'a2', courseId: 'c1', moduleId: 'a' },
            { id: 'b1', courseId: 'c1', moduleId: 'b' },
            { id: 'x1', courseId: 'c2', moduleId: 'x' },
        ];
        const inProgress = [{ module_id: 'c1', completed: false }];

        it('counts unpublished modules as zero, so finishing the published ones is not 100%', () => {
            const result = courseProgress('c1', {
                userCourses: inProgress,
                lessons: moduleLessons,
                userLessons: ['a1', 'a2', 'b1'].map(id => ({ completed: true, lesson_id: id })),
                modules,
            });
            expect(result).toEqual({ state: 'in-progress', percentage: 50 });
        });

        it('weights each module equally, whatever its number of lessons', () => {
            const result = courseProgress('c1', {
                userCourses: inProgress,
                lessons: moduleLessons,
                userLessons: [{ completed: true, lesson_id: 'a1' }],
                modules,
            });
            expect(result.percentage).toBe(13);
        });

        it('ignores modules of other courses', () => {
            const result = courseProgress('c2', {
                userCourses: [{ module_id: 'c2', completed: false }],
                lessons: moduleLessons,
                userLessons: [{ completed: true, lesson_id: 'x1' }],
                modules,
            });
            expect(result.percentage).toBe(100);
        });

        it('still reports 100% only when the course is marked completed', () => {
            const result = courseProgress('c1', { userCourses: [{ module_id: 'c1', completed: true }], lessons: moduleLessons, userLessons: [], modules });
            expect(result).toEqual({ state: 'completed', percentage: 100 });
        });
    });
});
