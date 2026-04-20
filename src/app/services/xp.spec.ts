import { TestBed } from '@angular/core/testing';

import { Xp } from './xp';

describe('Xp', () => {
  let service: Xp;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Xp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
