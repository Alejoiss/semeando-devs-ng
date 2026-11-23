export interface RevenueReportCourse {
    courseId: string;
    title: string;
    lessons: number;
}

export interface RevenueReportTeacher {
    teacherId: string | null;
    name: string | null;
    lessons: number;
}

export interface RevenueReportTopLesson {
    lessonId: string;
    title: string;
    courseTitle: string;
    lessons: number;
}

export interface RevenueReport {
    year: number;
    month: number;
    totalLessons: number;
    activeStudents: number;
    previousTotalLessons: number;
    previousActiveStudents: number;
    byCourse: RevenueReportCourse[];
    byTeacher: RevenueReportTeacher[];
    topLessons: RevenueReportTopLesson[];
}
