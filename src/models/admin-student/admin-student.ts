export interface AdminStudent {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isPro: boolean;
    createdAt: Date;
    newsletterActive?: boolean;
    termsAccepted?: boolean;
    proUntil?: Date | null;
}

export interface StudentListResult {
    students: AdminStudent[];
    total: number;
}

export interface StudentQueryParams {
    search: string;
    sortField: 'name' | 'created_at';
    sortDir: 'asc' | 'desc';
    page: number;
    pageSize: number;
}
