import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { XpService } from '../../services/xp';

@Component({
    selector: 'app-internal-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './internal-header.html',
    styleUrls: ['./internal-header.scss']
})
export class InternalHeader implements OnInit {
    private xpService = inject(XpService);
    protected readonly totalXp = this.xpService.totalXp;

    ngOnInit(): void {
        this.xpService.getXp();
    }
}
