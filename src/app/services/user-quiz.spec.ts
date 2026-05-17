import { TestBed } from '@angular/core/testing';

import { UserQuizService } from './user-quiz';

describe('UserQuizService', () => {
    let service: UserQuizService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserQuizService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
