import { TestBed } from '@angular/core/testing';

import { UserQuiz } from './user-quiz';

describe('UserQuiz', () => {
  let service: UserQuiz;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserQuiz);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
