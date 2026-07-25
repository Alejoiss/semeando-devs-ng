import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'app-kpi-card',
    templateUrl: './kpi-card.html',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
    readonly label = input.required<string>();
    readonly value = input.required<string>();
    readonly icon = input.required<string>();
    readonly trend = input<number | null>(null);
    readonly isLoading = input<boolean>(false);
    readonly hasError = input<boolean>(false);
}
