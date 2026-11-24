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
});
