import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

@Component({
    selector: 'app-line-chart',
    imports: [NgxEchartsDirective],
    template: `
        <figure [attr.aria-label]="ariaLabel()" class="m-0 w-full h-full">
            <div echarts [options]="options()" class="w-full h-64"></div>
        </figure>
    `,
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChart {
    readonly options = input.required<EChartsOption>();
    readonly ariaLabel = input<string>('Gráfico de linha');
}
