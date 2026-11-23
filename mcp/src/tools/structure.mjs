import { z } from 'zod';
import { defineTool, unwrap } from '../util.mjs';
import { nextOrder, ownerFields, resolveAuthorId, slugify } from '../lesson-model.mjs';

const id = z.string().uuid();

const moduleFields = {
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

  async function insertCourse(m) {
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

  async function insertModule(courseId, s, order) {
    const slug = s.slug ?? slugify(s.title);
    await assertFreeSlug('submodules', slug, { module_id: courseId });
    return unwrap(
      await db
        .from('submodules')
        .insert({
          module_id: courseId,
          title: s.title,
          description: s.description,
          slug,
          icon: s.icon ?? null,
          order: order ?? (await nextOrder(db, 'submodules', 'module_id', courseId)),
        })
        .select('id, slug, order')
        .single(),
      'submodules',
    );
  }

  defineTool(
    server,
    ctx,
    'create_course',
    {
      title: 'Criar curso',
      description:
        'Cria um curso vazio e OCULTO (in_revision = true), atribuído ao autor. Opcionalmente grava a apresentação (markdown) exibida na página do curso.',
      inputSchema: {
        title: z.string().min(1),
        description: z.string().min(1),
        slug: z.string().optional().describe('Padrão: derivado do título'),
        icon: z.string().optional(),
        avatar: z.string().optional().describe('URL da imagem'),
        intro_markdown: z.string().optional().describe('Apresentação resumida do curso'),
      },
    },
    async ({ intro_markdown, ...m }) => {
      const row = await insertCourse(m);
      if (intro_markdown) {
        unwrap(await db.from('section_content').insert({ module_id: row.id, type: 'MARKDOWN', content: intro_markdown, order: 0 }), 'intro');
      }
      return { course_id: row.id, slug: row.slug, in_revision: true };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_course',
    {
      title: 'Editar curso',
      description:
        'Altera título, descrição, slug, ícone, avatar ou a apresentação. in_revision=false PUBLICA o curso para todos os alunos: só use com aprovação explícita.',
      inputSchema: {
        course_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        avatar: z.string().optional(),
        in_revision: z.boolean().optional(),
        intro_markdown: z.string().optional(),
      },
    },
    async ({ course_id, intro_markdown, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (fields.slug) await assertFreeSlug('modules', fields.slug).catch(async (e) => {
        const cur = unwrap(await db.from('modules').select('slug').eq('id', course_id).single(), 'course');
        if (cur.slug !== fields.slug) throw e;
      });
      if (Object.keys(fields).length) unwrap(await db.from('modules').update(fields).eq('id', course_id), 'update_course');
      if (intro_markdown !== undefined) {
        unwrap(await db.from('section_content').delete().eq('module_id', course_id), 'limpar intro');
        unwrap(await db.from('section_content').insert({ module_id: course_id, type: 'MARKDOWN', content: intro_markdown, order: 0 }), 'intro');
      }
      return unwrap(await db.from('modules').select('id, title, slug, in_revision').eq('id', course_id).single(), 'course');
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_course',
    {
      title: 'Excluir curso',
      description:
        'Exclui um curso OCULTO (in_revision = true) com todos os módulos, lições e quizzes em cascata. Irreversível. Cursos publicados são recusados. Exige confirm_title igual ao título.',
      inputSchema: { course_id: id, confirm_title: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ course_id, confirm_title }) => {
      const m = unwrap(await db.from('modules').select('id, title, in_revision').eq('id', course_id).single(), 'course');
      if (m.title !== confirm_title) throw new Error(`confirm_title não confere. Título atual: "${m.title}".`);
      if (!m.in_revision) throw new Error('Curso publicado: volte-o para in_revision=true com update_course antes de excluir.');
      unwrap(await db.from('modules').delete().eq('id', course_id), 'delete_course');
      return { deleted: { id: m.id, title: m.title } };
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'create_module',
    {
      title: 'Criar módulo',
      description: 'Cria um módulo em um curso existente.',
      inputSchema: { course_id: id, ...moduleFields, order: z.number().int().optional().describe('Padrão: ao final') },
    },
    async ({ course_id, order, ...s }) => ({ ...(await insertModule(course_id, s, order)) }),
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_module',
    {
      title: 'Editar módulo',
      description: 'Altera título, descrição, slug, ícone ou ordem de um módulo.',
      inputSchema: {
        module_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().int().optional(),
      },
    },
    async ({ module_id, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (!Object.keys(fields).length) throw new Error('Nada para alterar.');
      return unwrap(
        await db.from('submodules').update(fields).eq('id', module_id).select('id, title, slug, order').single(),
        'update_module',
      );
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
        'Exclui o módulo e suas lições em cascata. Irreversível. Recusa se o curso estiver publicado. Exige confirm_title igual ao título.',
      inputSchema: { module_id: id, confirm_title: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ module_id, confirm_title }) => {
      const s = unwrap(
        await db.from('submodules').select('id, title, course:modules(in_revision)').eq('id', module_id).single(),
        'module',
      );
      if (s.title !== confirm_title) throw new Error(`confirm_title não confere. Título atual: "${s.title}".`);
      if (!s.course?.in_revision) throw new Error('O curso está publicado; volte-o para in_revision=true antes de excluir.');
      unwrap(await db.from('submodules').delete().eq('id', module_id), 'delete_module');
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
        'Cria de uma vez um curso OCULTO com seus módulos e as lições "normais" como esqueletos (título e descrição, sem conteúdo, rascunho). Preencha cada lição depois com set_lesson_content. Se algo falhar, o curso parcial é removido.',
      inputSchema: {
        course: z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          slug: z.string().optional(),
          icon: z.string().optional(),
          intro_markdown: z.string().optional(),
        }),
        modules: z
          .array(
            z.object({
              ...moduleFields,
              lessons: z.array(z.object({ title: z.string().min(1), description: z.string().min(1), xp: z.number().int().min(0).default(20) })).default([]),
            }),
          )
          .min(1),
      },
    },
    async ({ course, modules }) => {
      const owner = await ownerFields(db);
      const created_by = await resolveAuthorId(db, config);
      const { intro_markdown, ...mod } = course;
      const row = await insertCourse(mod);
      try {
        if (intro_markdown) {
          unwrap(await db.from('section_content').insert({ module_id: row.id, type: 'MARKDOWN', content: intro_markdown, order: 0 }), 'intro');
        }
        const created = [];
        for (const [i, { lessons, ...s }] of modules.entries()) {
          const sub = await insertModule(row.id, s, i + 1);
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
            created.push({ module_id: sub.id, title: s.title, lessons: inserted.sort((a, b) => a.order - b.order) });
          } else {
            created.push({ module_id: sub.id, title: s.title, lessons: [] });
          }
        }
        return { course_id: row.id, slug: row.slug, in_revision: true, modules: created };
      } catch (e) {
        await db.from('modules').delete().eq('id', row.id);
        throw new Error(`Roadmap revertido: ${e.message}`);
      }
    },
    { write: true },
  );
}
