import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

@Component({
    selector: 'app-not-found',
    imports: [RouterLink, Header, Footer],
    templateUrl: './not-found.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
