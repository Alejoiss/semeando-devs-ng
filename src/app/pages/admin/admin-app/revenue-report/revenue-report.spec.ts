import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRevenueReport } from './revenue-report';
import { AdminRevenueReportService } from '../../../../services/admin-revenue-report';
import { RevenueReport } from '../../../../../models/revenue-report/revenue-report';

describe('AdminRevenueReport', () => {
    let fixture: ComponentFixture<AdminRevenueReport>;
    let component: any;
    let service: jasmine.SpyObj<AdminRevenueReportService>;

    const report = (over: Partial<RevenueReport> = {}): RevenueReport => ({
        year: 2026,
        month: 10,
        totalLessons: 10,
        activeStudents: 4,
        previousTotalLessons: 8,
        previousActiveStudents: 0,
        byCourse: [{ courseId: 'm1', title: 'HTML', lessons: 10 }],
        byTeacher: [
            { teacherId: 't1', name: 'Ana', lessons: 6 },
            { teacherId: 't2', name: null, lessons: 3 },
            { teacherId: null, name: null, lessons: 1 },
        ],
        topLessons: [{ lessonId: 'l1', title: 'O que é HTML', courseTitle: 'HTML', lessons: 5 }],
        ...over,
    });

    const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    const money = (reais: string) => new RegExp(`R\\$\\s${reais}`);

    function type(selector: string, value: string, eventName = 'input') {
        const el = fixture.nativeElement.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
        el.value = value;
        el.dispatchEvent(new Event(eventName));
        fixture.detectChanges();
    }

    async function generate() {
        (fixture.nativeElement.querySelector('button[type="button"], button:not([type])') as HTMLButtonElement);
        await component.generate();
        fixture.detectChanges();
    }

    function setup() {
        fixture = TestBed.createComponent(AdminRevenueReport);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    beforeEach(() => {
        service = jasmine.createSpyObj('AdminRevenueReportService', ['getReport']);
        service.getReport.and.resolveTo(report());
        TestBed.configureTestingModule({ providers: [{ provide: AdminRevenueReportService, useValue: service }] });
    });

    describe('period', () => {
        beforeEach(() => jasmine.clock().install());
        afterEach(() => jasmine.clock().uninstall());

        it('starts on the previous month', () => {
            jasmine.clock().mockDate(new Date(2026, 10, 18, 12));
            setup();
            expect([component.month(), component.year()]).toEqual([10, 2026]);
        });

        it('wraps to December of the previous year in January', () => {
            jasmine.clock().mockDate(new Date(2026, 0, 15, 12));
            setup();
            expect([component.month(), component.year()]).toEqual([12, 2025]);
        });
    });

    describe('inputs', () => {
        beforeEach(() => setup());

        it('rejects years out of range and disables the generate button', () => {
            type('#report-year', '1999');

            expect(component.isYearValid()).toBeFalse();
            expect(text()).toContain('Informe um ano entre 2000 e 2100.');
            expect((fixture.nativeElement.querySelector('button[disabled]') as HTMLButtonElement)).toBeTruthy();
        });

        it('accepts a valid year', () => {
            type('#report-year', '2025');
            expect(component.isYearValid()).toBeTrue();
        });

        it('rejects non-integer years', () => {
            type('#report-year', '2025.5');
            expect(component.isYearValid()).toBeFalse();
        });

        it('reads the chosen month', () => {
            type('#report-month', '3', 'change');
            expect(component.month()).toBe(3);
        });

        it('reads income and outgoing amounts, ignoring negative or empty values', () => {
            type('#report-income', '1500.5');
            type('#report-outgoing', '-3');
            expect(component.income()).toBe(1500.5);
            expect(component.outgoing()).toBeNull();

            type('#report-income', '');
            expect(component.income()).toBeNull();
        });

        it('warns when outgoing exceeds income', () => {
            type('#report-income', '100');
            type('#report-outgoing', '150');

            expect(text()).toContain('A saída é maior que a entrada');
            expect(component.netCents()).toBe(0);
        });
    });

    describe('calculations', () => {
        beforeEach(() => setup());

        it('splits the net revenue half to the platform and half to the teachers', () => {
            component.income.set(1000);
            component.outgoing.set(200);

            expect(component.netCents()).toBe(80000);
            expect(component.teachersCents()).toBe(40000);
            expect(component.platformCents()).toBe(40000);
        });

        it('gives the odd cent to the platform', () => {
            component.income.set(0.03);
            expect(component.teachersCents()).toBe(1);
            expect(component.platformCents()).toBe(2);
        });

        it('has zero revenue before any amount is typed', () => {
            expect(component.netCents()).toBe(0);
            expect(component.averagePerLessonCents()).toBe(0);
        });

        it('formats cents as BRL and percentages with a decimal comma', () => {
            expect(component.formatCents(123456)).toMatch(money('1\\.234,56'));
            expect(component.formatPercent(33.333)).toBe('33,3%');
        });
    });

    describe('generating', () => {
        beforeEach(() => {
            setup();
            component.income.set(1000);
            component.outgoing.set(0);
        });

        it('asks the service for the chosen period', async () => {
            component.month.set(10);
            component.year.set(2026);

            await generate();

            expect(service.getReport).toHaveBeenCalledOnceWith(2026, 10);
            expect(text()).toContain('Outubro de 2026');
        });

        it('shows the summary cards with the computed values', async () => {
            await generate();

            expect(text()).toContain('Receita líquida');
            expect(text()).toMatch(money('1\\.000,00'));
            expect(text()).toContain('Plataforma (50%)');
            expect(text()).toContain('Professores (50%)');
            expect(text()).toMatch(money('50,00'));
        });

        it('computes the average per lesson from the teachers share', async () => {
            await generate();
            expect(component.averagePerLessonCents()).toBe(5000);
        });

        it('distributes the teachers share by completed lessons without losing cents', async () => {
            await generate();

            const rows = component.teacherRows();
            expect(rows.map((r: any) => r.amountCents)).toEqual([30000, 15000, 5000]);
            expect(rows.reduce((sum: number, r: any) => sum + r.amountCents, 0)).toBe(component.teachersCents());
            expect(rows.map((r: any) => Math.round(r.sharePercent))).toEqual([60, 30, 10]);
        });

        it('names teachers, with fallbacks for missing names and unassigned lessons', async () => {
            await generate();

            expect(component.teacherRows().map((r: any) => r.name)).toEqual(['Ana', 'Professor sem nome', 'Sem professor atribuído']);
            expect(text()).toContain('Há lições concluídas sem professor atribuído');
        });

        it('does not warn about unassigned lessons when there are none', async () => {
            service.getReport.and.resolveTo(report({ byTeacher: [{ teacherId: 't1', name: 'Ana', lessons: 10 }] }));
            await generate();
            expect(text()).not.toContain('sem professor atribuído');
        });

        it('shows the trends against the previous month, and none without a baseline', async () => {
            await generate();

            expect(component.lessonsTrend()).toBe(25);
            expect(component.studentsTrend()).toBeNull();
        });

        it('lists lessons per course and the most completed lessons', async () => {
            await generate();
            expect(text()).toContain('Lições por linguagem');
            expect(text()).toContain('Lições mais concluídas');
            expect(text()).toContain('O que é HTML');
        });

        it('says so when no lesson was completed in the month', async () => {
            service.getReport.and.resolveTo(report({ totalLessons: 0, byTeacher: [], byCourse: [], topLessons: [] }));
            await generate();

            expect(text()).toContain('Nenhuma lição concluída por alunos neste mês.');
            expect(text()).not.toContain('Repasse por professor');
            expect(component.averagePerLessonCents()).toBe(0);
        });

        it('shows the service error and clears the previous report', async () => {
            await generate();
            service.getReport.and.rejectWith(new Error('sem permissão'));

            await generate();

            expect(component.report()).toBeNull();
            expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('sem permissão');
        });

        it('uses a default message for non-Error failures', async () => {
            service.getReport.and.rejectWith('x');
            await generate();
            expect(component.error()).toBe('Não foi possível gerar o relatório.');
        });

        it('does not request with an invalid year', async () => {
            component.year.set(1900);
            await generate();
            expect(service.getReport).not.toHaveBeenCalled();
        });

        it('ignores a second request while loading', async () => {
            component.isLoading.set(true);
            await generate();
            expect(service.getReport).not.toHaveBeenCalled();
        });
    });

    describe('CSV export', () => {
        let blobs: Blob[];
        let download: string;

        beforeEach(() => {
            setup();
            blobs = [];
            spyOn(URL, 'createObjectURL').and.callFake(blob => (blobs.push(blob as Blob), 'blob:x'));
            spyOn(URL, 'revokeObjectURL');
            spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
                download = this.download;
            });
        });

        it('does nothing before a report is generated', () => {
            component.exportCsv();
            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });

        it('exports one line per teacher with escaped names, decimal commas and a BOM for Excel', async () => {
            service.getReport.and.resolveTo(report({
                byTeacher: [{ teacherId: 't1', name: 'Ana "A" Souza', lessons: 7 }, { teacherId: 't2', name: 'Bruno', lessons: 3 }],
            }));
            component.income.set(1000);
            await component.generate();

            component.exportCsv();

            const bytes = new Uint8Array(await blobs[0].arrayBuffer());
            expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
            const content = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
            expect(content.slice(1).split('\r\n')).toEqual([
                '"Professor";"Lições concluídas";"Participação (%)";"Valor (R$)"',
                '"Ana ""A"" Souza";7;70,00;350,00',
                '"Bruno";3;30,00;150,00',
            ]);
            expect(blobs[0].type).toBe('text/csv;charset=utf-8');
        });

        it('names the file after the period and releases the object URL', async () => {
            service.getReport.and.resolveTo(report({ year: 2026, month: 3 }));
            await component.generate();

            component.exportCsv();

            expect(download).toBe('relatorio-professores-2026-03.csv');
            expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
        });
    });
});
