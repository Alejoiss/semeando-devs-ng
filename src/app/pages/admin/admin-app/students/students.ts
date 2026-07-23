import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { AdminStudentService } from '../../../../services/admin-student';
import { AdminStudent } from '../../../../../models/admin-student/admin-student';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'app-admin-students',
    imports: [NgOptimizedImage, DatePipe, RouterLink, ReactiveFormsModule],
    templateUrl: './students.html',
    styleUrl: './students.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStudents {
    private readonly adminStudentService = inject(AdminStudentService);

    readonly searchQuery = signal('');
    readonly sortField = signal<'name' | 'created_at'>('name');
    readonly currentPage = signal(0);
    readonly pageSize = signal(10);

    readonly students = signal<AdminStudent[]>([]);
    readonly totalCount = signal(0);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);

    readonly searchControl = new FormControl('');

    constructor() {
        this.searchControl.valueChanges.pipe(
            debounceTime(300)
        ).subscribe(value => {
            this.onSearchChange(value || '');
        });

        effect(() => {
            // Read signals to trigger effect on change
            this.searchQuery();
            this.sortField();
            this.currentPage();
            this.pageSize();
            
            // Call untracked load
            this.loadStudents();
        });
    }

    onSearchChange(query: string) {
        this.searchQuery.set(query);
        this.currentPage.set(0);
    }

    async loadStudents() {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const result = await this.adminStudentService.getStudents({
                search: this.searchQuery(),
                sortField: this.sortField(),
                sortDir: this.sortField() === 'created_at' ? 'desc' : 'asc',
                page: this.currentPage(),
                pageSize: this.pageSize()
            });
            this.students.set(result.students);
            this.totalCount.set(result.total);
        } catch (err: any) {
            this.error.set(err.message || 'Não foi possível carregar os alunos. Tente novamente.');
            this.students.set([]);
            this.totalCount.set(0);
        } finally {
            this.isLoading.set(false);
        }
    }
}
