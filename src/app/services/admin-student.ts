import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AdminStudent, StudentListResult, StudentQueryParams } from '../../models/admin-student/admin-student';
import { SupabaseService } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class AdminStudentService {
    private supabase: SupabaseClient = inject(SupabaseService).client;

    async getStudents(params: StudentQueryParams): Promise<StudentListResult> {
        const { search, sortField, sortDir, page, pageSize } = params;
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let query = this.supabase
            .from('profiles')
            .select('id, is_pro, created_at, name, email, avatar', { count: 'exact' })
            .eq('role', 'student')
            .order(sortField, { ascending: sortDir === 'asc' })
            .range(from, to);

        if (search && search.trim()) {
            query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            throw new Error(error.message);
        }

        const students: AdminStudent[] = (data || []).map(row => ({
            id: row['id'] as string,
            name: (row['name'] as string) || '',
            email: (row['email'] as string) || '',
            avatar: (row['avatar'] as string) || '',
            isPro: (row['is_pro'] as boolean) || false,
            createdAt: new Date(row['created_at'] as string),
        }));

        return { students, total: count ?? 0 };
    }
}
