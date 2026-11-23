import { Course } from "../course/course";
import { User } from "../user/user";

export interface UserCourse {
    id: string;
    user: User;
    course: Course;
    completed: boolean;
    completedAt: Date;
}
