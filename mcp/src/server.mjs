import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { loadConfig } from './config.mjs';
import { registerPrompts } from './prompts.mjs';
import { registerContentTools } from './tools/content.mjs';
import { registerStructureTools } from './tools/structure.mjs';
import { registerQuizSocialTools } from './tools/quiz-social.mjs';

const config = loadConfig();
const db = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
const ctx = { db, config };

const server = new McpServer({ name: 'semeandodevs', version: '0.1.0' });
registerQuizSocialTools(server, ctx);
registerContentTools(server, ctx);
registerStructureTools(server, ctx);
registerPrompts(server);

await server.connect(new StdioServerTransport());
process.stderr.write(
  `semeandodevs-mcp pronto (${config.isLocal ? 'LOCAL' : 'PRODUÇÃO'}${config.readOnly ? ', somente leitura' : ''})\n`,
);
