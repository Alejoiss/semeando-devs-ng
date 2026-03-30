import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-modules',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './modules.html',
    styleUrls: ['./modules.scss'],
})
export class Modules { }
