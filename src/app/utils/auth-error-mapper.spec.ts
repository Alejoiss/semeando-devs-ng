import { mapAuthError } from './auth-error-mapper';

describe('mapAuthError', () => {
    const cases: [string, string][] = [
        ['Invalid login credentials', 'E-mail ou senha inválidos.'],
        ['Email not confirmed', 'Você precisa confirmar seu e-mail antes de entrar.'],
        ['User already registered', 'Já existe uma conta com este e-mail.'],
        ['Password should be at least 6 characters', 'A senha deve ter pelo menos 6 caracteres.'],
        ['Email rate limit exceeded', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
        ['Token has expired or is invalid', 'O link expirou. Solicite um novo.'],
        ['Email link is invalid or has expired', 'O link expirou ou já foi utilizado. Solicite um novo.'],
        ['Auth session missing', 'O link expirou ou já foi utilizado. Solicite um novo.'],
        ['User not found', 'Usuário não encontrado.'],
        ['Invalid grant', 'Credenciais inválidas ou expiradas.'],
        ['New password should be different from the old password', 'A nova senha deve ser diferente da antiga.'],
        ['Signup is disabled', 'O cadastro está temporariamente desativado.'],
        ['Database error saving new user', 'Erro ao salvar o novo usuário no banco de dados.'],
        ['Weak password', 'A senha é muito fraca. Tente uma combinação mais complexa.'],
    ];

    for (const [input, expected] of cases) {
        it(`translates "${input}"`, () => {
            expect(mapAuthError(input)).toBe(expected);
        });
    }

    it('matches case-insensitively and with extra details around the message', () => {
        expect(mapAuthError('AuthApiError: invalid LOGIN credentials (400)')).toBe('E-mail ou senha inválidos.');
    });

    it('falls back to a generic message for unknown errors', () => {
        expect(mapAuthError('something else')).toBe('Ocorreu um erro inesperado. Tente novamente.');
        expect(mapAuthError('')).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });
});
