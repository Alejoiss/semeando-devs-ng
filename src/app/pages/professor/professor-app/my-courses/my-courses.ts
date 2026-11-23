import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService } from '../../../../services/course';
import { UserService } from '../../../../services/user';
import { Course } from '../../../../../models/course/course';

@Component({
    selector: 'app-my-courses',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-courses.html',
    styleUrl: './my-courses.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCourses implements OnInit {
    private courseService = inject(CourseService);
    private userService = inject(UserService);

    protected readonly courses = signal<Course[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);
    protected readonly toggleError = signal<string | null>(null);
    protected readonly togglingCourseId = signal<string | null>(null);

    protected readonly isAdmin = computed(() => this.userService.currentUser()?.role === 'admin');

    async ngOnInit() {
        await this.loadCourses();
    }

    private async loadCourses() {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const user = this.userService.currentUser();
            if (!user) {
                this.error.set('Usuário não autenticado.');
                return;
            }

            const data = await this.courseService.getTeacherCourses(user.id);
            this.courses.set(data);
        } catch (err: any) {
            this.error.set(err.message || 'Erro ao carregar seus cursos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    async toggleAvailability(course: Course, available: boolean) {
        if (this.togglingCourseId()) return;
        this.toggleError.set(null);
        this.togglingCourseId.set(course.id);

        try {
            if (available) {
                const allValidated = await this.courseService.checkAllLessonsValidated(course.id);
                if (!allValidated) {
                    this.toggleError.set(`O curso "${course.title}" possui lições não validadas. Valide todas as lições antes de disponibilizá-lo.`);
                    return;
                }
            }

            await this.courseService.updateCourseAvailability(course.id, available);
            this.courses.update(list =>
                list.map(m => m.id === course.id ? { ...m, inRevision: !available } : m)
            );
        } catch (err: any) {
            this.toggleError.set(err.message || 'Erro ao alterar disponibilidade do curso.');
        } finally {
            this.togglingCourseId.set(null);
        }
    }
}
