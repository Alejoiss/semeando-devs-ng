import { TestBed } from '@angular/core/testing';

import { Seed } from './seed';

describe('Seed', () => {
  let service: Seed;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Seed);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
