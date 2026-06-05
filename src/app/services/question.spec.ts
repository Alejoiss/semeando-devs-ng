import { TestBed } from '@angular/core/testing';

import { QuestionService } from './question';

describe('QuestionService', () => {
    let service: QuestionService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(QuestionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call supabase delete when deleting questions by quiz id', async () => {
        const mockFrom = jasmine.createSpyObj('from', ['delete']);
        const mockDelete = jasmine.createSpyObj('delete', ['eq']);
        
        mockFrom.delete.and.returnValue(mockDelete);
        mockDelete.eq.and.returnValue(Promise.resolve({ error: null }));
        
        spyOn(service['supabase'], 'from').and.returnValue(mockFrom as any);
        
        await service.deleteQuestionsByQuizId('mock-quiz-id');
        
        expect(service['supabase'].from).toHaveBeenCalledWith('questions');
        expect(mockFrom.delete).toHaveBeenCalled();
        expect(mockDelete.eq).toHaveBeenCalledWith('quiz_id', 'mock-quiz-id');
    });

    it('should throw an error when supabase delete fails', async () => {
        const mockFrom = jasmine.createSpyObj('from', ['delete']);
        const mockDelete = jasmine.createSpyObj('delete', ['eq']);
        
        mockFrom.delete.and.returnValue(mockDelete);
        mockDelete.eq.and.returnValue(Promise.resolve({ error: { message: 'Database error' } }));
        
        spyOn(service['supabase'], 'from').and.returnValue(mockFrom as any);
        
        await expectAsync(service.deleteQuestionsByQuizId('mock-quiz-id')).toBeRejectedWithError('Database error');
    });
});
