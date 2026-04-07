import { SubModule } from "../sub-module/sub-module";
import { User } from "../user/user";

export interface UserSubModule {
    id: string;
    user: User;
    subModule: SubModule;
    completed: boolean;
    completedAt: Date;
}
