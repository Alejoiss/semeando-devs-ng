import { TestBed } from '@angular/core/testing';

import { SectionContent } from './section-content';

describe('SectionContent', () => {
  let service: SectionContent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SectionContent);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
