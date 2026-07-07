import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { XpService } from '../../services/xp';
import { SeedService } from '../../services/seed';
import { UserService } from '../../services/user';
import { NavigationService } from '../../services/navigation';
import { AdBannerComponent } from '../ad-banner/ad-banner';

@Component({
    selector: 'app-internal-header',
    standalone: true,
    imports: [CommonModule, RouterLink, AdBannerComponent],
    templateUrl: './internal-header.html',
    styleUrls: ['./internal-header.scss']
})
export class InternalHeader implements OnInit {
    private xpService = inject(XpService);
    private seedService = inject(SeedService);
    private userService = inject(UserService);
    protected readonly navigationService = inject(NavigationService);

    protected readonly totalXp = this.xpService.totalXp;
    protected readonly totalSeeds = this.seedService.totalSeeds;
    protected readonly currentUser = this.userService.currentUser;

    protected displayXp = signal(0);
    protected displaySeeds = signal(0);
    protected isPulsing = signal(false);

    private pulseTimeout?: any;
    private xpInterval?: any;
    private seedInterval?: any;

    constructor() {
        effect(() => {
            const targetXp = this.totalXp();
            const currentDisplay = untracked(this.displayXp);

            if (currentDisplay === 0 && targetXp > 0) {
                this.displayXp.set(targetXp);
                return;
            }

            if (targetXp !== currentDisplay) {
                this.triggerPulse();
                this.animateCounter(currentDisplay, targetXp, 'xp');
            }
        });

        effect(() => {
            const targetSeeds = this.totalSeeds();
            const currentDisplay = untracked(this.displaySeeds);

            if (currentDisplay === 0 && targetSeeds > 0) {
                this.displaySeeds.set(targetSeeds);
                return;
            }

            if (targetSeeds !== currentDisplay) {
                this.animateCounter(currentDisplay, targetSeeds, 'seed');
            }
        });
    }

    ngOnInit(): void {
        this.xpService.getXp();
        this.seedService.getSeeds();
    }

    private triggerPulse() {
        this.isPulsing.set(false);
        setTimeout(() => {
            this.isPulsing.set(true);
            if (this.pulseTimeout) clearTimeout(this.pulseTimeout);
            this.pulseTimeout = setTimeout(() => this.isPulsing.set(false), 600);
        }, 10);
    }

    private animateCounter(start: number, end: number, type: 'xp' | 'seed') {
        const interval = type === 'xp' ? this.xpInterval : this.seedInterval;
        if (interval) clearInterval(interval);

        const diff = end - start;
        const duration = 1000;
        const frameRate = 60;
        const totalFrames = (duration / 1000) * frameRate;
        const increment = diff / totalFrames;

        let currentFrame = 0;
        let currentValue = start;

        const newInterval = setInterval(() => {
            currentFrame++;
            currentValue += increment;

            if (currentFrame >= totalFrames) {
                if (type === 'xp') {
                    this.displayXp.set(end);
                } else {
                    this.displaySeeds.set(end);
                }
                clearInterval(newInterval);
            } else {
                if (type === 'xp') {
                    this.displayXp.set(Math.round(currentValue));
                } else {
                    this.displaySeeds.set(Math.round(currentValue));
                }
            }
        }, 1000 / frameRate);

        if (type === 'xp') {
            this.xpInterval = newInterval;
        } else {
            this.seedInterval = newInterval;
        }
    }
}
