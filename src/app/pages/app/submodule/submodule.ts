import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-submodule',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './submodule.html',
    styleUrls: ['./submodule.scss']
})
export class Submodule { }
