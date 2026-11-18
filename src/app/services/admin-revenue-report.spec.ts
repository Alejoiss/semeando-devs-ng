import { TestBed } from '@angular/core/testing';
import { AdminRevenueReportService } from './admin-revenue-report';
import { SupabaseService } from './supabase';

describe('AdminRevenueReportService', () => {
    let service: AdminRevenueReportService;
    let rpc: jasmine.Spy;

    beforeEach(() => {
        rpc = jasmine.createSpy('rpc');
        TestBed.configureTestingModule({
            providers: [{ provide: SupabaseService, useValue: { client: { rpc } } }],
        });
        service = TestBed.inject(AdminRevenueReportService);
    });

    it('calls admin_revenue_report with year and month and returns the data', async () => {
        const report = { total: 100 };
        rpc.and.resolveTo({ data: report, error: null });

        expect(await service.getReport(2026, 11)).toBe(report as any);
        expect(rpc).toHaveBeenCalledWith('admin_revenue_report', { p_year: 2026, p_month: 11 });
    });

    it('throws the rpc error message', async () => {
        rpc.and.resolveTo({ data: null, error: { message: 'forbidden' } });
        await expectAsync(service.getReport(2026, 1)).toBeRejectedWithError('forbidden');
    });
});
