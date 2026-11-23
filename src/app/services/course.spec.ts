import { TestBed } from '@angular/core/testing';
import { CourseService } from './course';

describe('CourseService', () => {
  let service: CourseService;
  let supabaseSpy: any;
  let fromSpy: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseService);

    fromSpy = {
      select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
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

  describe('getCourses (REQ-3)', () => {
    it('returns all courses on success', async () => {
      const mockCourses = [
        { id: '1', title: 'Course 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false },
        { id: '2', title: 'Course 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true }
      ];
      fromSpy.select.and.returnValue(Promise.resolve({ data: mockCourses, error: null }));

      const courses = await service.getCourses();
      expect(courses).toEqual([
        { id: '1', title: 'Course 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false, inRevision: false },
        { id: '2', title: 'Course 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true, inRevision: true }
      ] as any);
      expect(supabaseSpy.from).toHaveBeenCalledWith('modules');
      expect(fromSpy.select).toHaveBeenCalledWith('*');
    });

    it('throws error on failure', async () => {
      fromSpy.select.and.returnValue(Promise.resolve({ data: null, error: { message: 'DB Error' } }));

      await expectAsync(service.getCourses()).toBeRejectedWithError('DB Error');
    });
  });

  describe('getCoursesForDisplay (REQ-4.1)', () => {
    it('returns selected courses fields on success', async () => {
      const mockCourses = [
        { id: '1', title: 'Course 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false },
        { id: '2', title: 'Course 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true }
      ];
      fromSpy.select.and.returnValue(Promise.resolve({ data: mockCourses, error: null }));

      const courses = await service.getCoursesForDisplay();
      expect(courses).toEqual([
        { id: '1', title: 'Course 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false, inRevision: false },
        { id: '2', title: 'Course 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true, inRevision: true }
      ] as any);
      expect(supabaseSpy.from).toHaveBeenCalledWith('modules');
      expect(fromSpy.select).toHaveBeenCalledWith('id, title, description, slug, avatar, icon, in_revision');
    });

    it('throws error on failure', async () => {
      fromSpy.select.and.returnValue(Promise.resolve({ data: null, error: { message: 'DB Error' } }));

      await expectAsync(service.getCoursesForDisplay()).toBeRejectedWithError('DB Error');
    });
  });
});
