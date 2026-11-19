import { Question } from '../../../../../models/question/question';
import { SectionContentType } from '../../../../../models/section-content/section-content';

export function summarizeQuestion(question: Question | undefined, maxLength = 90): string {
    const contents = [...(question?.sectionContents ?? [])].sort((a, b) => a.order - b.order);

    const textBlock = contents.find(
        c => (c.type === SectionContentType.TEXT || c.type === SectionContentType.MARKDOWN) && stripMarkdown(c.content).length > 0
    );

    if (textBlock) {
        return truncate(stripMarkdown(textBlock.content), maxLength);
    }

    const image = contents.find(c => c.type === SectionContentType.IMAGE);
    if (image?.fileDescription?.trim()) return truncate(image.fileDescription.trim(), maxLength);

    return contents.length > 0 ? 'Questão de código' : 'Questão';
}

function stripMarkdown(source: string | null | undefined): string {
    return (source ?? '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
        .replace(/(\*\*|__|~~|\*)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
