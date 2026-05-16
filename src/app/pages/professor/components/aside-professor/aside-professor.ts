import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../../../services/user';
import { NavigationService } from '../../../../services/navigation';

@Component({
  selector: 'app-aside-professor',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './aside-professor.html',
  styleUrl: './aside-professor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideProfessor {
  protected readonly userService = inject(UserService);
  protected readonly navigationService = inject(NavigationService);
}
