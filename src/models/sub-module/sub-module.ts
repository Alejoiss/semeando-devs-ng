import { Module } from "../module/module";

export interface SubModule {
    id: string;
    title: string;
    description: string;
    avatar?: string;
    icon?: string;
    order: number;
    slug: string;
    module: Module;
}
