import { TestBed } from '@angular/core/testing';

import { AiCredits } from './ai-credits';

describe('AiCredits', () => {
  let service: AiCredits;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiCredits);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
