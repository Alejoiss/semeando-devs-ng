import { TestBed } from '@angular/core/testing';
import { ModuleService } from './module';

describe('ModuleService', () => {
  let service: ModuleService;
  let supabaseSpy: any;
  let fromSpy: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModuleService);

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

  describe('getModules (REQ-3)', () => {
    it('returns all modules on success', async () => {
      const mockModules = [
        { id: '1', title: 'Module 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false },
        { id: '2', title: 'Module 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true }
      ];
      fromSpy.select.and.returnValue(Promise.resolve({ data: mockModules, error: null }));

      const modules = await service.getModules();
      expect(modules).toEqual([
        { id: '1', title: 'Module 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false, inRevision: false },
        { id: '2', title: 'Module 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true, inRevision: true }
      ] as any);
      expect(supabaseSpy.from).toHaveBeenCalledWith('modules');
      expect(fromSpy.select).toHaveBeenCalledWith('*');
    });

    it('throws error on failure', async () => {
      fromSpy.select.and.returnValue(Promise.resolve({ data: null, error: { message: 'DB Error' } }));

      await expectAsync(service.getModules()).toBeRejectedWithError('DB Error');
    });
  });

  describe('getModulesForDisplay (REQ-4.1)', () => {
    it('returns selected modules fields on success', async () => {
      const mockModules = [
        { id: '1', title: 'Module 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false },
        { id: '2', title: 'Module 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true }
      ];
      fromSpy.select.and.returnValue(Promise.resolve({ data: mockModules, error: null }));

      const modules = await service.getModulesForDisplay();
      expect(modules).toEqual([
        { id: '1', title: 'Module 1', description: 'Desc 1', avatar: 'ava1', icon: 'icon1', in_revision: false, inRevision: false },
        { id: '2', title: 'Module 2', description: 'Desc 2', avatar: 'ava2', icon: 'icon2', in_revision: true, inRevision: true }
      ] as any);
      expect(supabaseSpy.from).toHaveBeenCalledWith('modules');
      expect(fromSpy.select).toHaveBeenCalledWith('id, title, description, slug, avatar, icon, in_revision');
    });

    it('throws error on failure', async () => {
      fromSpy.select.and.returnValue(Promise.resolve({ data: null, error: { message: 'DB Error' } }));

      await expectAsync(service.getModulesForDisplay()).toBeRejectedWithError('DB Error');
    });
  });
});
