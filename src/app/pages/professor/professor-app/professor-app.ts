import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../../services/navigation';
import { HeaderProfessor } from '../components/header-professor/header-professor';
import { AsideProfessor } from '../components/aside-professor/aside-professor';

@Component({
  selector: 'app-professor-app',
  standalone: true,
  imports: [
    RouterModule,
    HeaderProfessor,
    AsideProfessor
  ],
  templateUrl: './professor-app.html',
  styleUrl: './professor-app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorApp {
  protected readonly navigationService = inject(NavigationService);
}
