import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

export function loadConfig(env = process.env) {
  const url = env.MCP_SUPABASE_URL;
  const key = env.MCP_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'MCP_SUPABASE_URL e MCP_SUPABASE_SERVICE_ROLE_KEY são obrigatórias (defina em mcp/.env). Sem elas o servidor não inicia.',
    );
  }

  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
  if (!isLocal && !url.startsWith('https://')) {
    throw new Error('MCP_SUPABASE_URL remota precisa usar https.');
  }

  return {
    url,
    key,
    isLocal,
    readOnly: env.MCP_READ_ONLY === '1',
    authorUserId: env.MCP_AUTHOR_USER_ID || null,
  };
}
