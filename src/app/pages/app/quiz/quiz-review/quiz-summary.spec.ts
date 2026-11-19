import { Question } from '../../../../../models/question/question';
import { SectionContent, SectionContentType } from '../../../../../models/section-content/section-content';
import { summarizeQuestion } from './quiz-summary';

function question(...contents: Partial<SectionContent>[]): Question {
    return {
        id: 'q1',
        quizId: 'quiz',
        sectionContents: contents.map((c, i) => ({ id: `c${i}`, order: i, content: '', file: '', fileDescription: '', ...c }) as SectionContent),
    };
}

describe('summarizeQuestion', () => {
    it('uses the first text block', () => {
        const q = question({ type: SectionContentType.TEXT, content: 'O que é uma variável?' });
        expect(summarizeQuestion(q)).toBe('O que é uma variável?');
    });

    it('strips markdown syntax and code fences', () => {
        const q = question({
            type: SectionContentType.MARKDOWN,
            content: '## Qual a saída?\n\n```js\nconsole.log(1)\n```\n\nUse **`let`** com [docs](http://x.y)',
        });
        expect(summarizeQuestion(q)).toBe('Qual a saída? Use let com docs');
    });

    it('truncates long text with an ellipsis', () => {
        const q = question({ type: SectionContentType.TEXT, content: 'a'.repeat(200) });
        const summary = summarizeQuestion(q, 20);
        expect(summary.length).toBe(20);
        expect(summary.endsWith('…')).toBeTrue();
    });

    it('falls back to the image description, then to a generic label', () => {
        expect(summarizeQuestion(question({ type: SectionContentType.IMAGE, fileDescription: 'Diagrama de fluxo' }))).toBe('Diagrama de fluxo');
        expect(summarizeQuestion(question({ type: SectionContentType.MARKDOWN, content: '```js\nx\n```' }))).toBe('Questão de código');
        expect(summarizeQuestion(undefined)).toBe('Questão');
    });
});
