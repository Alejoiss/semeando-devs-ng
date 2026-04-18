import { TestBed } from '@angular/core/testing';

import { UserQuestion } from './user-question';

describe('UserQuestion', () => {
  let service: UserQuestion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserQuestion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
