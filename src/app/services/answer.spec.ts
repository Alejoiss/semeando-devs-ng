import { TestBed } from '@angular/core/testing';

import { AnswerService } from './answer';

describe('AnswerService', () => {
    let service: AnswerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AnswerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
