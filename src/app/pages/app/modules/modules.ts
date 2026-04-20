import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Module } from '../../../../models/module/module';
import { UserModule } from '../../../../models/user-module/user-module';
import { ModuleService } from '../../../services/module';
import { UserModuleService } from '../../../services/user-module';

type ProgressState = 'not-started' | 'in-progress' | 'completed';

interface ModuleWithState {
    module: Module;
    progressState: ProgressState;
}

@Component({
    selector: 'app-modules',
    imports: [RouterLink],
    templateUrl: './modules.html',
    styleUrls: ['./modules.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modules implements OnInit {
    private readonly moduleService = inject(ModuleService);
    private readonly userModuleService = inject(UserModuleService);
    private readonly router = inject(Router);

    protected readonly modules = signal<Module[]>([]);
    protected readonly userModules = signal<UserModule[]>([]);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly error = signal<string | null>(null);

    protected readonly modulesWithState = computed<ModuleWithState[]>(() => {
        const userModuleMap = new Map<string, UserModule>(
            this.userModules().map((um) => [um.module.id, um])
        );

        return this.modules().map((module) => {
            const userModule = userModuleMap.get(module.id);
            let progressState: ProgressState = 'not-started';

            if (userModule) {
                progressState = userModule.completed ? 'completed' : 'in-progress';
            }

            return { module, progressState };
        });
    });

    async ngOnInit(): Promise<void> {
        await this.loadData();
    }

    private async loadData(): Promise<void> {
        try {
            this.isLoading.set(true);
            const [modules, userModules] = await Promise.all([
                this.moduleService.getModules(),
                this.userModuleService.getUserModules(),
            ]);
            this.modules.set(modules);
            this.userModules.set(userModules);
        } catch (err) {
            this.error.set(err instanceof Error ? err.message : 'Erro ao carregar os módulos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async onStartModule(moduleId: string, slug: string): Promise<void> {
        try {
            await this.userModuleService.startModule(moduleId);
            await this.router.navigate(['/app/s', slug]);
        } catch (err) {
            console.error('Erro ao iniciar módulo:', err);
        }
    }
}
