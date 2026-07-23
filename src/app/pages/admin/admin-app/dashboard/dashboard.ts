import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-admin-dashboard',
    template: `
        <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
            <div class="w-20 h-20 rounded-full bg-[#0f1930] flex items-center justify-center shadow-[0_0_30px_rgba(63,194,251,0.15)]">
                <span class="material-symbols-outlined text-4xl text-[#3fc2fb]">dashboard</span>
            </div>
            <div class="text-center">
                <h2 class="text-2xl font-bold text-[#dee5ff] font-headline mb-2">Dashboard</h2>
                <p class="text-[#dee5ff]/50 font-body">Esta seção está em construção.</p>
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {}
