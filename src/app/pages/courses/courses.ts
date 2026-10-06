import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { PublicModule, publicLessonPath } from '../../services/public-catalog/public-catalog';

@Component({
    selector: 'app-courses',
    standalone: true,
    imports: [RouterLink, Header, Footer],
    templateUrl: './courses.html',
    styleUrls: ['./courses.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Courses {
    protected readonly curriculum = signal<PublicModule[]>(inject(ActivatedRoute).snapshot.data['curriculum'] ?? []);
    protected readonly expandedModules = signal<ReadonlySet<string>>(new Set());
    protected readonly expandedSubmodules = signal<ReadonlySet<string>>(new Set());
    protected readonly lessonPath = publicLessonPath;

    protected toggleModule(id: string) {
        this.expandedModules.update(ids => toggle(ids, id));
    }

    protected toggleSubmodule(id: string) {
        this.expandedSubmodules.update(ids => toggle(ids, id));
    }
}

function toggle(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
    const next = new Set(ids);
    if (!next.delete(id)) {
        next.add(id);
    }
    return next;
}
