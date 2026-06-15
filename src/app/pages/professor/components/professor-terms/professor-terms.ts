import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UserService } from '../../../../services/user';

@Component({
    selector: 'app-professor-terms',
    templateUrl: './professor-terms.html',
    styleUrl: './professor-terms.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorTerms {
    private readonly userService = inject(UserService);

    protected readonly isAccepting = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    async onAccept(): Promise<void> {
        this.isAccepting.set(true);
        this.errorMessage.set(null);
        try {
            await this.userService.acceptTeacherTerms();
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message
                : 'Ocorreu um erro. Tente novamente.';
            this.errorMessage.set(message);
        } finally {
            this.isAccepting.set(false);
        }
    }

    scrollToSection(sectionId: string): void {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
