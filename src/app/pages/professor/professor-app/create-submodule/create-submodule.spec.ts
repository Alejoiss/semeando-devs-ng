import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSubmodule } from './create-submodule';

describe('CreateSubmodule', () => {
  let component: CreateSubmodule;
  let fixture: ComponentFixture<CreateSubmodule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSubmodule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSubmodule);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
