import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user';
import { NavigationService } from '../../../../services/navigation';

@Component({
  selector: 'app-header-professor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header-professor.html',
  styleUrl: './header-professor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderProfessor {
  private userService = inject(UserService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly currentUser = this.userService.currentUser;
}
