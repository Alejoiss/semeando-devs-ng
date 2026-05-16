import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModuleService } from '../../../../services/module';
import { UserService } from '../../../../services/user';
import { Module } from '../../../../../models/module/module';

@Component({
    selector: 'app-my-modules',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-modules.html',
    styleUrl: './my-modules.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyModules implements OnInit {
    private moduleService = inject(ModuleService);
    private userService = inject(UserService);

    protected readonly modules = signal<Module[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly error = signal<string | null>(null);

    async ngOnInit() {
        await this.loadModules();
    }

    private async loadModules() {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const user = this.userService.currentUser();
            if (!user) {
                this.error.set('Usuário não autenticado.');
                return;
            }

            const data = await this.moduleService.getTeacherModules(user.id);
            this.modules.set(data);
        } catch (err: any) {
            this.error.set(err.message || 'Erro ao carregar seus módulos.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
