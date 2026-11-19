export type AiFeature = 'evaluate_challenge' | 'evaluate_lesson_content';

export const AI_FEATURES: { feature: AiFeature; label: string; description: string }[] = [
    {
        feature: 'evaluate_challenge',
        label: 'Avaliação de desafios de código',
        description: 'Feedback dado ao aluno quando ele envia a solução de um desafio.',
    },
    {
        feature: 'evaluate_lesson_content',
        label: 'Avaliação de conteúdo de lições',
        description: 'Revisão do conteúdo de uma lição feita pelo professor antes de publicar.',
    },
];

export type AiModels = Record<AiFeature, string[]>;

export interface AiSettings {
    models: AiModels;
    emails: string[];
}

export type AiModelStatus = 'ok' | 'expiring' | 'removed' | 'failing';

export interface AiModelCheck {
    feature: AiFeature;
    model: string;
    status: AiModelStatus;
    expiresAt: string | null;
    detail: string | null;
}

export interface AiModelCheckResult {
    checks: AiModelCheck[];
    catalogAvailable: boolean;
}
