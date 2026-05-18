import { TestBed } from '@angular/core/testing';

import { AiCreditsService } from './ai-credits';

describe('AiCreditsService', () => {
    let service: AiCreditsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AiCreditsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
