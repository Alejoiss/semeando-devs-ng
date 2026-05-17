import { TestBed } from '@angular/core/testing';

import { UserQuestionService } from './user-question';

describe('UserQuestionService', () => {
    let service: UserQuestionService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserQuestionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
