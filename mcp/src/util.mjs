export function ok(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

export function fail(message) {
  return { isError: true, content: [{ type: 'text', text: String(message) }] };
}

export function unwrap({ data, error }, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
  return data;
}

export function audit(tool, args) {
  const ids = Object.fromEntries(Object.entries(args).filter(([k, v]) => k.endsWith('_id') && typeof v === 'string'));
  process.stderr.write(`[audit ${new Date().toISOString()}] ${tool} ${JSON.stringify(ids)}\n`);
}

// Registra a tool com tratamento de erro uniforme; escritas são bloqueadas em modo somente leitura.
export function defineTool(server, ctx, name, spec, handler, { write = false } = {}) {
  server.registerTool(name, spec, async (args) => {
    if (write && ctx.config.readOnly) {
      return fail('Servidor em modo somente leitura (MCP_READ_ONLY=1).');
    }
    try {
      const result = await handler(args);
      if (write) audit(name, args);
      return ok(result);
    } catch (e) {
      return fail(e.message ?? e);
    }
  });
}
