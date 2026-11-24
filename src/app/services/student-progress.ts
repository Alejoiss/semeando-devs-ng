import { inject, Injectable } from '@angular/core';
import { LessonService } from './lesson';
import { UserCourseService } from './user-course';
import { UserLessonService } from './user-lesson';
import { UserService } from './user';
import { ProgressSources } from '../utils/course-progress';

@Injectable({
    providedIn: 'root',
})
export class StudentProgressService {
    private readonly userService = inject(UserService);
    private readonly userCourseService = inject(UserCourseService);
    private readonly userLessonService = inject(UserLessonService);
    private readonly lessonService = inject(LessonService);

    async load(): Promise<ProgressSources> {
        let userId = this.userService.currentUser()?.id;
        if (!userId) {
            await this.userService.loadUserProfile();
            userId = this.userService.currentUser()?.id;
        }
        if (!userId) {
            throw new Error('Usuário não autenticado.');
        }

        const [userCourses, userLessons, lessons] = await Promise.all([
            this.userCourseService.getUserCoursesForUser(userId),
            this.userLessonService.getUserLessonsForUser(userId),
            this.lessonService.getLessonsLightweight(),
        ]);

        return { userCourses, userLessons, lessons };
    }
}
