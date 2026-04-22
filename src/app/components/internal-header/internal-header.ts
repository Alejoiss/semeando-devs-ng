import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit, signal, untracked } from '@angular/core';
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

    protected displayXp = signal(0);
    protected isPulsing = signal(false);
    private pulseTimeout?: any;
    private counterInterval?: any;

    constructor() {
        effect(() => {
            const targetXp = this.totalXp();
            const currentDisplay = untracked(this.displayXp);

            // Initial sync or jump if difference is small
            if (currentDisplay === 0 && targetXp > 0) {
                this.displayXp.set(targetXp);
                return;
            }

            if (targetXp !== currentDisplay) {
                this.triggerPulse();
                this.animateCounter(currentDisplay, targetXp);
            }
        });
    }

    ngOnInit(): void {
        this.xpService.getXp();
    }

    private triggerPulse() {
        this.isPulsing.set(false);
        // Force reflow/tick for CSS animation restart
        setTimeout(() => {
            this.isPulsing.set(true);
            if (this.pulseTimeout) clearTimeout(this.pulseTimeout);
            this.pulseTimeout = setTimeout(() => this.isPulsing.set(false), 600);
        }, 10);
    }

    private animateCounter(start: number, end: number) {
        if (this.counterInterval) clearInterval(this.counterInterval);

        const diff = end - start;
        const duration = 1000; // 1 second for the animation
        const frameRate = 60;
        const totalFrames = (duration / 1000) * frameRate;
        const increment = diff / totalFrames;

        let currentFrame = 0;
        let currentValue = start;

        this.counterInterval = setInterval(() => {
            currentFrame++;
            currentValue += increment;

            if (currentFrame >= totalFrames) {
                this.displayXp.set(end);
                clearInterval(this.counterInterval);
            } else {
                this.displayXp.set(Math.round(currentValue));
            }
        }, 1000 / frameRate);
    }
}
