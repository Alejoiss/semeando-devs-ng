import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { ModuleService } from '../../services/module';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, Header, Footer],
  templateUrl: './courses.html',
  styleUrls: ['./courses.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Courses implements OnInit {
  private readonly moduleService = inject(ModuleService);
  protected readonly curriculum = signal<any[]>([]);

  async ngOnInit() {
    try {
      const data = await this.moduleService.getCurriculum();
      const processed = data.map(mod => {
        return {
          ...mod,
          expanded: false,
          submodules: mod.submodules.map((sub: any) => ({
            ...sub,
            expanded: false,
            lessons: sub.lessons.filter((l: any) => l.type === 'LESSON')
          }))
        };
      });
      this.curriculum.set(processed);
    } catch (error) {
      console.error('Error loading curriculum', error);
    }
  }

  protected toggleModule(mod: any) {
    mod.expanded = !mod.expanded;
  }

  protected toggleSubmodule(sub: any) {
    sub.expanded = !sub.expanded;
  }
}
