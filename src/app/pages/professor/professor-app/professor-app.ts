import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../../services/navigation';
import { UserService } from '../../../services/user';
import { HeaderProfessor } from '../components/header-professor/header-professor';
import { AsideProfessor } from '../components/aside-professor/aside-professor';
import { ProfessorTerms } from '../components/professor-terms/professor-terms';

@Component({
  selector: 'app-professor-app',
  standalone: true,
  imports: [
    RouterModule,
    HeaderProfessor,
    AsideProfessor,
    ProfessorTerms,
  ],
  templateUrl: './professor-app.html',
  styleUrl: './professor-app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorApp {
  protected readonly navigationService = inject(NavigationService);
  private readonly userService = inject(UserService);

  protected readonly showTermsModal = computed(() => {
    const user = this.userService.currentUser();
    return !user?.teacherTermsAccepted;
  });
}
