export interface RevenueReportModule {
    moduleId: string;
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
    moduleTitle: string;
    lessons: number;
}

export interface RevenueReport {
    year: number;
    month: number;
    totalLessons: number;
    activeStudents: number;
    previousTotalLessons: number;
    previousActiveStudents: number;
    byModule: RevenueReportModule[];
    byTeacher: RevenueReportTeacher[];
    topLessons: RevenueReportTopLesson[];
}
