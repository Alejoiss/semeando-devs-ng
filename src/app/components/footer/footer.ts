import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './footer.html',
    styleUrls: ['./footer.scss']
})
export class Footer {
    currentYear: number = new Date().getFullYear();
}
