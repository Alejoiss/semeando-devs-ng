import { Course } from '../course/course';

export interface Track {
    id: string;
    slug: string;
    title: string;
    description: string;
    icon: string | null;
    order: number;
    published: boolean;
}

export interface TrackWithCourses extends Track {
    courses: Course[];
}

export interface TrackSummary {
    id: string;
    slug: string;
    title: string;
}

export interface TrackPayload {
    title: string;
    slug: string;
    description: string;
    icon: string | null;
    published: boolean;
}
