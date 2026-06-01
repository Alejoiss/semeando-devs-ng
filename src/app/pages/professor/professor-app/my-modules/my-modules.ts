import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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
    protected readonly toggleError = signal<string | null>(null);
    protected readonly togglingModuleId = signal<string | null>(null);

    protected readonly isAdmin = computed(() => this.userService.currentUser()?.role === 'admin');

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

    async toggleAvailability(module: Module, available: boolean) {
        if (this.togglingModuleId()) return;
        this.toggleError.set(null);
        this.togglingModuleId.set(module.id);

        try {
            if (available) {
                const allValidated = await this.moduleService.checkAllLessonsValidated(module.id);
                if (!allValidated) {
                    this.toggleError.set(`O módulo "${module.title}" possui lições não validadas. Valide todas as lições antes de disponibilizá-lo.`);
                    return;
                }
            }

            await this.moduleService.updateModuleAvailability(module.id, available);
            this.modules.update(list =>
                list.map(m => m.id === module.id ? { ...m, inRevision: !available } : m)
            );
        } catch (err: any) {
            this.toggleError.set(err.message || 'Erro ao alterar disponibilidade do módulo.');
        } finally {
            this.togglingModuleId.set(null);
        }
    }
}
