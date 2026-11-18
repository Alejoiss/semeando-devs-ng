export type E2eRole = 'student' | 'teacher' | 'admin';

export interface E2eUser {
    id: string;
    email: string;
    password: string;
    role: E2eRole;
    storageState: string;
}

export const E2E_PASSWORD = 'E2e-Passw0rd!';

// O id do professor é o `created_by` fixo de supabase/dev-seed/seed-test-content.sql
export const E2E_USERS = {
    student: { id: '00000000-0000-4000-8000-0000000000a1', email: 'e2e-aluno@e2e.test', role: 'student' },
    teacher: { id: '634f7ea6-e0b3-4ffd-95eb-efc6b73a42ba', email: 'e2e-professor@e2e.test', role: 'teacher' },
    admin: { id: '00000000-0000-4000-8000-0000000000a3', email: 'e2e-admin@e2e.test', role: 'admin' },
} as const satisfies Record<string, Omit<E2eUser, 'password' | 'storageState'>>;

export const E2E_USER_IDS = Object.values(E2E_USERS).map(user => user.id);

export const storageStateFor = (role: keyof typeof E2E_USERS) => `e2e/.auth/${role}.json`;
