import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-lesson',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './lesson.html',
    styleUrls: ['./lesson.scss']
})
export class Lesson {}
