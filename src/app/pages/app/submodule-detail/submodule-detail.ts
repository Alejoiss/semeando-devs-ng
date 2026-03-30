import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-submodule-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './submodule-detail.html',
    styleUrls: ['./submodule-detail.scss'],
})
export class SubmoduleDetail {}
