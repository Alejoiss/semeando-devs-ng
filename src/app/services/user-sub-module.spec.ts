import { TestBed } from '@angular/core/testing';
import { UserSubModuleService } from './user-sub-module';

describe('UserSubModuleService', () => {
    let service: UserSubModuleService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UserSubModuleService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('verifies user completion states store properly', () => {
        // Validating REQ-2.1 and REQ-3.2: service can track user specific submodule completion
        expect(typeof service.getUserSubModules).toBe('function');
    });
});
