import { TestBed } from '@angular/core/testing';
import { AdminStudentService } from './admin-student';
import { StudentQueryParams } from '../../models/admin-student/admin-student';

describe('AdminStudentService', () => {
    let service: AdminStudentService;
    let supabaseSpy: any;
    let queryBuilderSpy: any;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AdminStudentService);

        queryBuilderSpy = {
            select: jasmine.createSpy('select').and.returnValue(null),
            eq: jasmine.createSpy('eq').and.returnValue(null),
            order: jasmine.createSpy('order').and.returnValue(null),
            range: jasmine.createSpy('range').and.returnValue(null),
            or: jasmine.createSpy('or').and.returnValue(null),
            then: jasmine.createSpy('then').and.callFake((callback: any) => {
                return Promise.resolve(callback({ data: [], error: null, count: 0 }));
            })
        };

        // Make all methods return the queryBuilderSpy itself to allow chaining, except 'then'
        queryBuilderSpy.select.and.returnValue(queryBuilderSpy);
        queryBuilderSpy.eq.and.returnValue(queryBuilderSpy);
        queryBuilderSpy.order.and.returnValue(queryBuilderSpy);
        queryBuilderSpy.range.and.returnValue(queryBuilderSpy);
        queryBuilderSpy.or.and.returnValue(queryBuilderSpy);

        supabaseSpy = {
            from: jasmine.createSpy('from').and.returnValue(queryBuilderSpy)
        };

        (service as any).supabase = supabaseSpy;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('applies basic filters and pagination correctly', async () => {
        const params: StudentQueryParams = {
            search: '',
            sortField: 'name',
            sortDir: 'asc',
            page: 1,
            pageSize: 20
        };

        await service.getStudents(params);

        expect(supabaseSpy.from).toHaveBeenCalledWith('profiles');
        expect(queryBuilderSpy.select).toHaveBeenCalledWith('id, is_pro, created_at, name, email, avatar', { count: 'exact' });
        expect(queryBuilderSpy.eq).toHaveBeenCalledWith('role', 'student');
        expect(queryBuilderSpy.order).toHaveBeenCalledWith('name', { ascending: true });
        expect(queryBuilderSpy.range).toHaveBeenCalledWith(20, 39); // page 1, size 20 -> offset 20, limit 39
        expect(queryBuilderSpy.or).not.toHaveBeenCalled();
    });

    it('applies search filter when search query is provided', async () => {
        const params: StudentQueryParams = {
            search: ' john  ',
            sortField: 'created_at',
            sortDir: 'desc',
            page: 0,
            pageSize: 10
        };

        await service.getStudents(params);

        expect(queryBuilderSpy.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(queryBuilderSpy.range).toHaveBeenCalledWith(0, 9);
        expect(queryBuilderSpy.or).toHaveBeenCalledWith('name.ilike.%john%,email.ilike.%john%');
    });

    it('returns formatted students and total count', async () => {
        const mockData = [
            {
                id: '123',
                name: 'Alice',
                email: 'alice@test.com',
                avatar: 'av1.png',
                is_pro: true,
                created_at: '2026-07-20T10:00:00Z'
            }
        ];

        // Override the 'then' mock for this specific test
        queryBuilderSpy.then = jasmine.createSpy('then').and.callFake((callback: any) => {
            return Promise.resolve(callback({ data: mockData, error: null, count: 42 }));
        });

        const params: StudentQueryParams = {
            search: '',
            sortField: 'name',
            sortDir: 'asc',
            page: 0,
            pageSize: 10
        };

        const result = await service.getStudents(params);

        expect(result.total).toBe(42);
        expect(result.students.length).toBe(1);
        expect(result.students[0]).toEqual({
            id: '123',
            name: 'Alice',
            email: 'alice@test.com',
            avatar: 'av1.png',
            isPro: true,
            createdAt: new Date('2026-07-20T10:00:00Z')
        });
    });

    it('throws error if supabase query fails', async () => {
        queryBuilderSpy.then = jasmine.createSpy('then').and.callFake((callback: any) => {
            return Promise.resolve(callback({ data: null, error: { message: 'Database error' }, count: null }));
        });

        const params: StudentQueryParams = {
            search: '',
            sortField: 'name',
            sortDir: 'asc',
            page: 0,
            pageSize: 10
        };

        await expectAsync(service.getStudents(params)).toBeRejectedWithError('Database error');
    });
});
