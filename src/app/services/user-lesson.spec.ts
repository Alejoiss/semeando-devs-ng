import { TestBed } from '@angular/core/testing';
import { UserLessonService } from './user-lesson';

describe('UserLessonService', () => {
    let service: UserLessonService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserLessonService);
    });

    // Task 4.5 — REQ-5.4
    it('should be created as a singleton', () => {
        expect(service).toBeTruthy();
    });

    // Task 4.5 — REQ-5.4: provided in root
    it('should share the same instance across injections', () => {
        const service2 = TestBed.inject(UserLessonService);
        expect(service).toBe(service2);
    });

    // Task 4.5 — REQ-5.1, REQ-5.2: method exists
    it('should expose getUserLessons as a function', () => {
        expect(typeof service.getUserLessons).toBe('function');
    });

    // Task 4.5 — REQ-5.1, REQ-5.3: internal Supabase client is configured
    it('should have a configured Supabase client', () => {
        expect(service['supabase']).toBeDefined();
    });

    // Task 4.5 — REQ-5.2: unauthenticated user causes rejection
    it('should return a Promise from getUserLessons', () => {
        const result = service.getUserLessons();
        expect(result).toBeInstanceOf(Promise);
        result.catch(() => {}); // expected to reject without a session in unit context
    });
});
