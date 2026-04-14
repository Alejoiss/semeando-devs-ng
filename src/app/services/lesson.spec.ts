import { TestBed } from '@angular/core/testing';
import { LessonService } from './lesson';

describe('LessonService', () => {
    let service: LessonService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LessonService);
    });

    // Task 4.4 — REQ-4.3
    it('should be created as a singleton', () => {
        expect(service).toBeTruthy();
    });

    // Task 4.4 — REQ-4.3: provided in root
    it('should share the same instance across injections', () => {
        const service2 = TestBed.inject(LessonService);
        expect(service).toBe(service2);
    });

    // Task 4.4 — REQ-4.1: method exists and accepts a slug
    it('should expose getLessonsBySubModuleSlug as a function', () => {
        expect(typeof service.getLessonsBySubModuleSlug).toBe('function');
    });

    // Task 4.4 — REQ-4.1, REQ-4.2: internal Supabase client is configured
    it('should have a configured Supabase client', () => {
        expect(service['supabase']).toBeDefined();
    });

    // Task 4.4 — REQ-4.2: method returns a Promise (verifiable at call site)
    it('should return a Promise from getLessonsBySubModuleSlug', () => {
        const result = service.getLessonsBySubModuleSlug('any-slug');
        expect(result).toBeInstanceOf(Promise);
        result.catch(() => {}); // swallow network error in unit context
    });
});
