import { randomUUID } from 'node:crypto';
import { sql } from './backend';

const SOURCE_COURSE_SLUG = 'html-essencial';

export interface ClonedCourse {
    courseId: string;
    slug: string;
    modules: { id: string; slug: string; title: string; lessonIds: string[] }[];
}

/** Copia completa e válida do curso HTML Essencial (módulos, aulas, seções, materiais, quizzes), isolada dos demais specs. */
export function cloneCourse(slug: string): ClonedCourse {
    const courseId = randomUUID();
    const sources = sql(`select s.id from submodules s join modules m on m.id = s.module_id where m.slug = '${SOURCE_COURSE_SLUG}' order by s."order"`).split('\n');
    const moduleIds = sources.map(() => randomUUID());

    sql(`do $$
declare
  src_modules uuid[] := array[${sources.map(id => `'${id}'`).join(',')}]::uuid[];
  new_modules uuid[] := array[${moduleIds.map(id => `'${id}'`).join(',')}]::uuid[];
  src_course uuid;
  i int;
  l record; q record; qq record; new_lesson uuid; new_quiz uuid; new_question uuid;
  clone_row jsonb;
begin
  select id into src_course from modules where slug = '${SOURCE_COURSE_SLUG}';
  insert into modules select (jsonb_populate_record(null::public.modules, to_jsonb(m) || jsonb_build_object('id', '${courseId}', 'slug', '${slug}', 'title', 'ZZ Clone ${slug}', 'in_revision', false))).* from modules m where m.id = src_course;

  for i in 1..array_length(src_modules, 1) loop
    insert into submodules select (jsonb_populate_record(null::public.submodules, to_jsonb(s) || jsonb_build_object('id', new_modules[i], 'module_id', '${courseId}', 'slug', s.slug || '-${slug}', 'published', true))).* from submodules s where s.id = src_modules[i];

    for l in select * from lessons where sub_module_id = src_modules[i] loop
      new_lesson := gen_random_uuid();
      insert into lessons select (jsonb_populate_record(null::public.lessons, to_jsonb(l) || jsonb_build_object('id', new_lesson, 'sub_module_id', new_modules[i]))).*;
      insert into section_content select (jsonb_populate_record(null::public.section_content, to_jsonb(sc) || jsonb_build_object('id', gen_random_uuid(), 'lesson_id', new_lesson))).* from section_content sc where sc.lesson_id = l.id;
      insert into extra_material select (jsonb_populate_record(null::public.extra_material, to_jsonb(em) || jsonb_build_object('id', gen_random_uuid(), 'lesson_id', new_lesson))).* from extra_material em where em.lesson_id = l.id;
      for q in select * from quizzes where lesson_id = l.id loop
        new_quiz := gen_random_uuid();
        insert into quizzes select (jsonb_populate_record(null::public.quizzes, to_jsonb(q) || jsonb_build_object('id', new_quiz, 'lesson_id', new_lesson))).*;
        for qq in select * from questions where quiz_id = q.id loop
          new_question := gen_random_uuid();
          insert into questions select (jsonb_populate_record(null::public.questions, to_jsonb(qq) || jsonb_build_object('id', new_question, 'quiz_id', new_quiz))).*;
          insert into answers select (jsonb_populate_record(null::public.answers, to_jsonb(a) || jsonb_build_object('id', gen_random_uuid(), 'question_id', new_question))).* from answers a where a.question_id = qq.id;
          insert into section_content select (jsonb_populate_record(null::public.section_content, to_jsonb(sc) || jsonb_build_object('id', gen_random_uuid(), 'question_id', new_question))).* from section_content sc where sc.question_id = qq.id;
        end loop;
      end loop;
    end loop;
  end loop;
end $$;`);

    const modules = moduleIds.map(id => {
        const [slugValue, title] = sql(`select slug || '|' || title from submodules where id = '${id}'`).split('|');
        const lessonIds = sql(`select id from lessons where sub_module_id = '${id}' order by "order"`).split('\n').filter(Boolean);
        return { id, slug: slugValue, title, lessonIds };
    });
    return { courseId, slug, modules };
}

export function removeCourse(courseId: string): void {
    sql(`delete from modules where id = '${courseId}'`);
}
