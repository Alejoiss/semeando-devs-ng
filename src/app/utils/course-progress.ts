export type ProgressState = 'not-started' | 'in-progress' | 'completed';

export interface CourseProgress {
    state: ProgressState;
    percentage: number;
}

export interface ProgressSources {
    userCourses: { module_id?: string; course?: { id: string }; completed: boolean }[];
    lessons: { id: string; courseId: string; moduleId?: string }[];
    modules?: { id: string; courseId: string; published: boolean }[];
    userLessons: { completed: boolean; lesson_id?: string; lesson?: { id: string } }[];
}

export function courseProgress(courseId: string, { userCourses, lessons, userLessons, modules }: ProgressSources): CourseProgress {
    const userCourse = userCourses.find(uc => (uc.module_id || uc.course?.id) === courseId);
    if (!userCourse) {
        return { state: 'not-started', percentage: 0 };
    }
    if (userCourse.completed) {
        return { state: 'completed', percentage: 100 };
    }

    const courseModules = modules?.filter(m => m.courseId === courseId) ?? [];
    if (courseModules.length > 0) {
        const completedIds = new Set(userLessons.filter(ul => ul.completed).map(ul => ul.lesson?.id || ul.lesson_id || ''));
        const sum = courseModules.reduce((total, module) => {
            if (!module.published) return total;
            const moduleLessons = lessons.filter(l => l.moduleId === module.id);
            if (moduleLessons.length === 0) return total;
            return total + moduleLessons.filter(l => completedIds.has(l.id)).length / moduleLessons.length;
        }, 0);
        return { state: 'in-progress', percentage: Math.round((sum / courseModules.length) * 100) };
    }

    const courseLessonIds = new Set(lessons.filter(l => l.courseId === courseId).map(l => l.id));
    if (courseLessonIds.size === 0) {
        return { state: 'in-progress', percentage: 0 };
    }
    const done = userLessons.filter(ul => ul.completed && courseLessonIds.has(ul.lesson?.id || ul.lesson_id || '')).length;
    return { state: 'in-progress', percentage: Math.round((done / courseLessonIds.size) * 100) };
}
