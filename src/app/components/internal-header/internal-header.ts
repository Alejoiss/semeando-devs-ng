import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-internal-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './internal-header.html',
    styleUrls: ['./internal-header.scss']
})
export class InternalHeader {}
