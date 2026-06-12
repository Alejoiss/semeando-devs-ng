import { TestBed } from '@angular/core/testing';
import { AchievementsService } from './achievements';
import { UserService } from './user';

describe('AchievementsService', () => {
    let service: AchievementsService;
    let userServiceSpy: jasmine.SpyObj<UserService>;
    let supabaseSpy: any;
    let fromSpy: any;
    let selectSpy: any;
    let eqSpy: any;
    let orderSpy: any;

    beforeEach(() => {
        const userSpy = jasmine.createSpyObj('UserService', ['getUserProfile']);

        TestBed.configureTestingModule({
            providers: [
                { provide: UserService, useValue: userSpy }
            ]
        });

        service = TestBed.inject(AchievementsService);
        userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;

        orderSpy = jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: [], error: null }));
        eqSpy = jasmine.createSpy('eq').and.returnValue({ order: orderSpy });
        selectSpy = {
            eq: eqSpy
        };
        fromSpy = {
            select: jasmine.createSpy('select').and.returnValue(selectSpy)
        };
        supabaseSpy = {
            from: jasmine.createSpy('from').and.returnValue(fromSpy)
        };

        // Replace internal supabase client
        (service as any).supabase = supabaseSpy;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getAchievements', () => {
        it('should fetch only visible achievements ordered by created_at', async () => {
            const mockData = [
                { id: '1', name: 'Achievement 1', is_visible: true, created_at: '2026-01-01' },
                { id: '2', name: 'Achievement 2', is_visible: true, created_at: '2026-01-02' }
            ];
            orderSpy.and.returnValue(Promise.resolve({ data: mockData, error: null }));

            const result = await service.getAchievements();

            expect(result.length).toBe(2);
            expect(result[0].id).toBe('1');
            expect(result[0].isVisible).toBe(true);
            expect(supabaseSpy.from).toHaveBeenCalledWith('achievements');
            expect(fromSpy.select).toHaveBeenCalledWith('*');
            expect(eqSpy).toHaveBeenCalledWith('is_visible', true);
            expect(orderSpy).toHaveBeenCalledWith('created_at', { ascending: true });
        });

        it('should handle errors gracefully', async () => {
            orderSpy.and.returnValue(Promise.resolve({ data: null, error: { message: 'Fetch error' } }));

            const result = await service.getAchievements();

            expect(result).toEqual([]);
        });
    });
});
