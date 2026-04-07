import { Module } from "../module/module";
import { User } from "../user/user";

export interface UserModule {
    id: string;
    user: User;
    module: Module;
    completed: boolean;
    completedAt: Date;
}
