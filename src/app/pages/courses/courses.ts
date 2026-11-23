import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { PublicCourse, publicLessonPath } from '../../services/public-catalog/public-catalog';

@Component({
    selector: 'app-courses',
    standalone: true,
    imports: [RouterLink, Header, Footer],
    templateUrl: './courses.html',
    styleUrls: ['./courses.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Courses {
    protected readonly curriculum = signal<PublicCourse[]>(inject(ActivatedRoute).snapshot.data['curriculum'] ?? []);
    protected readonly expandedCourses = signal<ReadonlySet<string>>(new Set());
    protected readonly expandedModules = signal<ReadonlySet<string>>(new Set());
    protected readonly lessonPath = publicLessonPath;

    protected toggleCourse(id: string) {
        this.expandedCourses.update(ids => toggle(ids, id));
    }

    protected toggleModule(id: string) {
        this.expandedModules.update(ids => toggle(ids, id));
    }
}

function toggle(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
    const next = new Set(ids);
    if (!next.delete(id)) {
        next.add(id);
    }
    return next;
}
