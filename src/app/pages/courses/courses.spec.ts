import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';

import { Courses } from './courses';
import { PublicModule } from '../../services/public-catalog/public-catalog';

describe('Courses', () => {
  let component: Courses;
  let fixture: ComponentFixture<Courses>;

  const curriculum: PublicModule[] = [{
    id: 'm1', slug: 'css', title: 'CSS', description: 'Estilos', icon: 'palette',
    submodules: [{
      id: 's1', slug: 'introducao', title: 'Introdução', description: '', icon: null,
      lessons: [{ id: 'l1', slug: 'o-que-e-css', title: 'O que é CSS', description: '' }],
    }],
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Courses],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { curriculum } } } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Courses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should link each module to its public page and reveal lesson links when expanded', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[href="/cursos/css"]')).toBeTruthy();

    element.querySelector<HTMLButtonElement>('button[aria-controls="conteudo-css"]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('#conteudo-css button')!.click();
    fixture.detectChanges();

    expect(element.querySelector('a[href="/cursos/css/introducao/o-que-e-css"]')).toBeTruthy();
  });
});
