export type ProgressState = 'not-started' | 'in-progress' | 'completed';

export interface CourseProgress {
    state: ProgressState;
    percentage: number;
}

export interface ProgressSources {
    userCourses: { module_id?: string; course?: { id: string }; completed: boolean }[];
    lessons: { id: string; courseId: string }[];
    userLessons: { completed: boolean; lesson_id?: string; lesson?: { id: string } }[];
}

export function courseProgress(courseId: string, { userCourses, lessons, userLessons }: ProgressSources): CourseProgress {
    const userCourse = userCourses.find(uc => (uc.module_id || uc.course?.id) === courseId);
    if (!userCourse) {
        return { state: 'not-started', percentage: 0 };
    }
    if (userCourse.completed) {
        return { state: 'completed', percentage: 100 };
    }

    const courseLessonIds = new Set(lessons.filter(l => l.courseId === courseId).map(l => l.id));
    if (courseLessonIds.size === 0) {
        return { state: 'in-progress', percentage: 0 };
    }
    const done = userLessons.filter(ul => ul.completed && courseLessonIds.has(ul.lesson?.id || ul.lesson_id || '')).length;
    return { state: 'in-progress', percentage: Math.round((done / courseLessonIds.size) * 100) };
}
