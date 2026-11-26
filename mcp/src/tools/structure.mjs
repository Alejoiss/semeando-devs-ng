import { z } from 'zod';
import { defineTool, unwrap } from '../util.mjs';
import { applyModuleValidation, checkCourseReadiness, checkModule, nextOrder, ownerFields, resolveAuthorId, slugify } from '../lesson-model.mjs';

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
        'Altera título, descrição, slug, ícone, avatar ou a apresentação. in_revision=false PUBLICA o curso para todos os alunos: só use com aprovação explícita, e exige ao menos 1 módulo publicado e válido (os módulos não publicados não contam).',
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
      if (fields.in_revision === false) {
        const readiness = await checkCourseReadiness(db, course_id);
        if (!readiness.passed) throw new Error(`Curso não publicado, falta ao menos 1 módulo publicado e válido:\n- ${readiness.problems.join('\n- ')}`);
      }
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
      description:
        'Altera título, descrição, slug, ícone, ordem ou publicação de um módulo. published=true PUBLICA o módulo para os alunos (só se todas as lições passarem na validação; use com aprovação explícita). published=false despublica sem aviso.',
      inputSchema: {
        module_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().int().optional(),
        published: z.boolean().optional(),
      },
    },
    async ({ module_id, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (!Object.keys(fields).length) throw new Error('Nada para alterar.');
      if (fields.published === true) {
        const result = await applyModuleValidation(db, module_id);
        if (!result.passed) throw new Error(`Módulo não validado, não foi publicado:\n- ${result.problems.join('\n- ')}`);
      }
      return unwrap(
        await db.from('submodules').update(fields).eq('id', module_id).select('id, title, slug, order, published').single(),
        'update_module',
      );
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'validate_module',
    {
      title: 'Validar módulo',
      description:
        'Roda a validação de todas as lições do módulo (LESSON, CHALLENGE e REVISION) e devolve o resultado por lição. Com dry_run=false grava is_validated em cada uma. Não publica: para isso use update_module com published=true.',
      inputSchema: { module_id: id, dry_run: z.boolean().default(true) },
    },
    async ({ module_id, dry_run }) => (dry_run ? checkModule(db, module_id) : applyModuleValidation(db, module_id)),
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

  async function trackWithCourses(trackId) {
    const track = unwrap(await db.from('tracks').select('id, slug, title, description, icon, order, published').eq('id', trackId).single(), 'track');
    const rows = unwrap(
      await db.from('track_courses').select('position, course:modules(id, title, slug, in_revision)').eq('track_id', trackId).order('position'),
      'track_courses',
    );
    return { ...track, courses: rows.map((r) => ({ position: r.position, ...r.course })) };
  }

  async function replaceTrackCourses(trackId, courseIds) {
    if (new Set(courseIds).size !== courseIds.length) throw new Error('course_ids tem cursos repetidos.');
    if (courseIds.length) {
      const found = unwrap(await db.from('modules').select('id').in('id', courseIds), 'cursos');
      const missing = courseIds.filter((cid) => !found.some((f) => f.id === cid));
      if (missing.length) throw new Error(`Curso(s) inexistente(s): ${missing.join(', ')}`);
    }
    unwrap(await db.from('track_courses').delete().eq('track_id', trackId), 'limpar trilha');
    if (courseIds.length) {
      unwrap(
        await db.from('track_courses').insert(courseIds.map((module_id, i) => ({ track_id: trackId, module_id, position: i + 1 }))),
        'track_courses',
      );
    }
  }

  defineTool(
    server,
    ctx,
    'list_tracks',
    {
      title: 'Listar trilhas',
      description: 'Lista as trilhas (publicadas ou não) com seus cursos em ordem.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const tracks = unwrap(await db.from('tracks').select('id').order('order'), 'tracks');
      return Promise.all(tracks.map((t) => trackWithCourses(t.id)));
    },
  );

  defineTool(
    server,
    ctx,
    'create_track',
    {
      title: 'Criar trilha',
      description:
        'Cria uma trilha OCULTA (published = false) e, opcionalmente, associa cursos na ordem informada. Um curso pode estar em várias trilhas.',
      inputSchema: {
        title: z.string().min(1),
        description: z.string().min(1),
        slug: z.string().optional().describe('Padrão: derivado do título'),
        icon: z.string().optional().describe('Nome de ícone Material Symbols'),
        course_ids: z.array(id).optional().describe('Cursos na ordem da trilha'),
      },
    },
    async ({ course_ids = [], ...t }) => {
      const slug = t.slug ?? slugify(t.title);
      await assertFreeSlug('tracks', slug);
      const last = unwrap(await db.from('tracks').select('order').order('order', { ascending: false }).limit(1), 'ordem');
      const row = unwrap(
        await db
          .from('tracks')
          .insert({ title: t.title, description: t.description, slug, icon: t.icon ?? null, order: (last[0]?.order ?? 0) + 1, published: false })
          .select('id')
          .single(),
        'tracks',
      );
      try {
        await replaceTrackCourses(row.id, course_ids);
      } catch (e) {
        await db.from('tracks').delete().eq('id', row.id);
        throw e;
      }
      return trackWithCourses(row.id);
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'update_track',
    {
      title: 'Editar trilha',
      description:
        'Altera título, descrição, slug, ícone, ordem entre trilhas ou publicação. course_ids SUBSTITUI a lista de cursos pela ordem enviada. published=true torna a trilha visível a todos os alunos: só use com aprovação explícita.',
      inputSchema: {
        track_id: id,
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        slug: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().int().optional(),
        published: z.boolean().optional(),
        course_ids: z.array(id).optional().describe('Lista completa de cursos na ordem desejada'),
      },
    },
    async ({ track_id, course_ids, ...patch }) => {
      const fields = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      if (fields.slug) {
        const cur = unwrap(await db.from('tracks').select('slug').eq('id', track_id).single(), 'track');
        if (cur.slug !== fields.slug) await assertFreeSlug('tracks', fields.slug);
      }
      if (Object.keys(fields).length) unwrap(await db.from('tracks').update(fields).eq('id', track_id), 'update_track');
      if (course_ids) await replaceTrackCourses(track_id, course_ids);
      return trackWithCourses(track_id);
    },
    { write: true },
  );

  defineTool(
    server,
    ctx,
    'delete_track',
    {
      title: 'Excluir trilha',
      description: 'Exclui uma trilha e suas associações. Os cursos não são afetados. Exige confirm_title igual ao título.',
      inputSchema: { track_id: id, confirm_title: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ track_id, confirm_title }) => {
      const t = unwrap(await db.from('tracks').select('id, title').eq('id', track_id).single(), 'track');
      if (t.title !== confirm_title) throw new Error(`confirm_title não confere. Título atual: "${t.title}".`);
      unwrap(await db.from('tracks').delete().eq('id', track_id), 'delete_track');
      return { deleted: t };
    },
    { write: true },
  );
}
