/**
 * Maps Supabase Auth error messages from English to Portuguese.
 * @param message The original error message from Supabase.
 * @returns A user-friendly error message in Portuguese.
 */
export function mapAuthError(message: string): string {
    const errors: Record<string, string> = {
        'Invalid login credentials': 'E-mail ou senha inválidos.',
        'Email not confirmed': 'Você precisa confirmar seu e-mail antes de entrar.',
        'User already registered': 'Já existe uma conta com este e-mail.',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
        'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'Token has expired or is invalid': 'O link expirou. Solicite um novo.',
        'User not found': 'Usuário não encontrado.',
        'Invalid grant': 'Credenciais inválidas ou expiradas.',
        'New password should be different from the old password': 'A nova senha deve ser diferente da antiga.',
        'Signup is disabled': 'O cadastro está temporariamente desativado.',
        'Database error saving new user': 'Erro ao salvar o novo usuário no banco de dados.',
        'Weak password': 'A senha é muito fraca. Tente uma combinação mais complexa.',
    };

    // Busca por correspondência parcial, pois às vezes a mensagem vem com detalhes extras
    const match = Object.keys(errors).find(key => message.toLowerCase().includes(key.toLowerCase()));
    
    return match ? errors[match] : 'Ocorreu um erro inesperado. Tente novamente.';
}
