import { Course } from "../course/course";

export interface Module {
    id: string;
    title: string;
    description: string;
    avatar?: string;
    icon?: string;
    order: number;
    slug: string;
    course: Course;
}
