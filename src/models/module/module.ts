export interface Module {
    id: string;
    title: string;
    description: string;
    avatar?: string;
    icon?: string;
    slug: string;
    inRevision: boolean;
    createdBy?: string;
}
