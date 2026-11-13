import { z } from 'zod';
import { defineTool, unwrap } from '../util.mjs';
import { nextOrder, ownerFields, resolveAuthorId, slugify } from '../lesson-model.mjs';

const id = z.string().uuid();

const submoduleFields = {
  title: z.string().min(1),
  description: z.string().min(1),
  slug: z.string().optional().describe('Padrão: derivado do título'),
  icon: z.string().optional().describe('Nome de ícone Material Symbols'),
};

export function registerStructureTools(server, ctx) {
  const { db, config } = ctx;

  async function assertFreeSlug(table, slug, scope = {}) {
    let q = db.from(table).select('id').eq('slug', slug);
    for (const [k, v] of Object.entries(scope)) q = q.eq(k, v);
    if (unwrap(await q.limit(1), `${table} slug`).length) throw new Error(`Já existe ${table} com o slug "${slug}".`);
  }

  async function insertModule(m) {
    const slug = m.slug ?? slugify(m.title);
    await assertFreeSlug('modules', slug);
    const created_by = await resolveAuthorId(db, config);
    const row = unwrap(
      await db
        .from('modules')
        .insert({ title: m.title, description: m.description, slug, icon: m.icon ?? null, avatar: m.avatar ?? null, in_revision: true, created_by })
        .select('id, slug')
        .single(),
      'modules',
    );
    if (created_by) {
      unwrap(await db.from('teacher_modules').insert({ teacher_id: created_by, module_id: row.id, assigned_by: created_by }), 'teacher_modules');
    }
    return row;
  }

  async function insertSubmodule(moduleId, s, order) {
    const slug = s.slug ?? slugify(s.title);
    await assertFreeSlug('submodules', slug, { module_id: moduleId });
    return unwrap(
      await db
        .from('submodules')
        .insert({
          module_id: moduleId,
          title: s.title,
          description: s.description,
          slug,
          icon: s.icon ?? null,
          order: order ?? (await nextOrder(db, 'submodules', 'module_id', moduleId)),
        })
        .select('id, slug, order')
        .single(),
      'submodules',
    );
  }

  defineTool(
    server,
    ctx,
    'create_module',
    {
      title: 'Criar módulo',
      description:
        'Cria um módulo (futuramente "Curso") vazio e OCULTO (in_revision = true), atribuído ao autor. Opcionalmente grava a apresentação (markdown) exibida na página do módulo.',
      inputSchema: {
        title: z.string().min(1),
        description: z.string().min(1),
        slug: z.string().optional().describe('Padrão: derivado do título'),
        icon: z.string().optional(),
        avatar: z.string().optional().describe('URL da imagem'),
        intro_markdown: z.string().optional().describe('Apresentação resumida do módulo'),
      },
    },
    async ({ intro_markdown, ...m }) => {
      const row = await insertModule(m);
      if (intro_markdown) {
        unwrap(await db.from('section_content').insert({ module_id: row.id, type: 'MARKDOWN', content: intro_markdown, order: 0 }), 'intro');
      }
      return { module_id: row.id, slug: row.slug, in_revision: true };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_module',
    {
      title: 'Editar módulo',
      description:
        'Altera título, descrição, slug, ícone, avatar ou a apresentação. in_revision=false PUBLICA o módulo para todos os alunos: só use com aprovação explícita.',
      inputSchema: {
        module_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        avatar: z.string().optional(),
        in_revision: z.boolean().optional(),
        intro_markdown: z.string().optional(),
      },
    },
    async ({ module_id, intro_markdown, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (fields.slug) await assertFreeSlug('modules', fields.slug).catch(async (e) => {
        const cur = unwrap(await db.from('modules').select('slug').eq('id', module_id).single(), 'module');
        if (cur.slug !== fields.slug) throw e;
      });
      if (Object.keys(fields).length) unwrap(await db.from('modules').update(fields).eq('id', module_id), 'update_module');
      if (intro_markdown !== undefined) {
        unwrap(await db.from('section_content').delete().eq('module_id', module_id), 'limpar intro');
        unwrap(await db.from('section_content').insert({ module_id, type: 'MARKDOWN', content: intro_markdown, order: 0 }), 'intro');
      }
      return unwrap(await db.from('modules').select('id, title, slug, in_revision').eq('id', module_id).single(), 'module');
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_module',
    {
      title: 'Excluir módulo',
      description:
        'Exclui um módulo OCULTO (in_revision = true) com todos os submódulos, lições e quizzes em cascata. Irreversível. Módulos publicados são recusados. Exige confirm_title igual ao título.',
      inputSchema: { module_id: id, confirm_title: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ module_id, confirm_title }) => {
      const m = unwrap(await db.from('modules').select('id, title, in_revision').eq('id', module_id).single(), 'module');
      if (m.title !== confirm_title) throw new Error(`confirm_title não confere. Título atual: "${m.title}".`);
      if (!m.in_revision) throw new Error('Módulo publicado: volte-o para in_revision=true com update_module antes de excluir.');
      unwrap(await db.from('modules').delete().eq('id', module_id), 'delete_module');
      return { deleted: { id: m.id, title: m.title } };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'create_submodule',
    {
      title: 'Criar submódulo',
      description: 'Cria um submódulo (futuramente "Módulo") em um módulo existente.',
      inputSchema: { module_id: id, ...submoduleFields, order: z.number().int().optional().describe('Padrão: ao final') },
    },
    async ({ module_id, order, ...s }) => ({ ...(await insertSubmodule(module_id, s, order)) }),
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_submodule',
    {
      title: 'Editar submódulo',
      description: 'Altera título, descrição, slug, ícone ou ordem de um submódulo.',
      inputSchema: {
        submodule_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().int().optional(),
      },
    },
    async ({ submodule_id, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (!Object.keys(fields).length) throw new Error('Nada para alterar.');
      return unwrap(
        await db.from('submodules').update(fields).eq('id', submodule_id).select('id, title, slug, order').single(),
        'update_submodule',
      );
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_submodule',
    {
      title: 'Excluir submódulo',
      description:
        'Exclui o submódulo e suas lições em cascata. Irreversível. Recusa se o módulo estiver publicado. Exige confirm_title igual ao título.',
      inputSchema: { submodule_id: id, confirm_title: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ submodule_id, confirm_title }) => {
      const s = unwrap(
        await db.from('submodules').select('id, title, module:modules(in_revision)').eq('id', submodule_id).single(),
        'submodule',
      );
      if (s.title !== confirm_title) throw new Error(`confirm_title não confere. Título atual: "${s.title}".`);
      if (!s.module?.in_revision) throw new Error('O módulo está publicado; volte-o para in_revision=true antes de excluir.');
      unwrap(await db.from('submodules').delete().eq('id', submodule_id), 'delete_submodule');
      return { deleted: { id: s.id, title: s.title } };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'create_roadmap',
    {
      title: 'Criar roadmap completo',
      description:
        'Cria de uma vez um módulo OCULTO com seus submódulos e as lições "normais" como esqueletos (título e descrição, sem conteúdo, rascunho). Preencha cada lição depois com set_lesson_content. Se algo falhar, o módulo parcial é removido.',
      inputSchema: {
        module: z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          slug: z.string().optional(),
          icon: z.string().optional(),
          intro_markdown: z.string().optional(),
        }),
        submodules: z
          .array(
            z.object({
              ...submoduleFields,
              lessons: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), xp: z.number().int().min(0).default(20) })).default([]),
            }),
          )
          .min(1),
      },
    },
    async ({ module, submodules }) => {
      const owner = await ownerFields(db);
      const created_by = await resolveAuthorId(db, config);
      const { intro_markdown, ...mod } = module;
      const row = await insertModule(mod);
      try {
        if (intro_markdown) {
          unwrap(await db.from('section_content').insert({ module_id: row.id, type: 'MARKDOWN', content: intro_markdown, order: 0 }), 'intro');
        }
        const created = [];
        for (const [i, { lessons, ...s }] of submodules.entries()) {
          const sub = await insertSubmodule(row.id, s, i + 1);
          if (lessons.length) {
            const inserted = unwrap(
              await db
                .from('lessons')
                .insert(
                  lessons.map((l, j) => ({
                    sub_module_id: sub.id,
                    title: l.title,
                    description: l.description,
                    type: 'LESSON',
                    xp: l.xp,
                    order: j + 1,
                    ...owner,
                    created_by,
                  })),
                )
                .select('id, title, order'),
              'lessons',
            );
            created.push({ submodule_id: sub.id, title: s.title, lessons: inserted.sort((a, b) => a.order - b.order) });
          } else {
            created.push({ submodule_id: sub.id, title: s.title, lessons: [] });
          }
        }
        return { module_id: row.id, slug: row.slug, in_revision: true, submodules: created };
      } catch (e) {
        await db.from('modules').delete().eq('id', row.id);
        throw new Error(`Roadmap revertido: ${e.message}`);
      }
    },
    { write: true },
  );
}
