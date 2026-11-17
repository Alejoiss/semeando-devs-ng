import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { AdminNewsletterService } from '../../../../../services/admin-newsletter';
import { NewsletterPreview } from '../newsletter-preview';

@Component({
    selector: 'app-admin-newsletter-detail',
    imports: [DatePipe, RouterLink, NewsletterPreview],
    templateUrl: './newsletter-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNewsletterDetail {
    private readonly newsletterService = inject(AdminNewsletterService);

    private readonly route = inject(ActivatedRoute);

    private readonly id = toSignal(this.route.paramMap.pipe(map(params => params.get('id') ?? '')), { initialValue: '' });

    protected readonly newsletter = resource({
        params: () => this.id(),
        loader: ({ params }) => this.newsletterService.getNewsletter(params),
    });
}
