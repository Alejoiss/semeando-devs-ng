import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabExtraMaterial } from './tab-extra-material';
import { ReactiveFormsModule } from '@angular/forms';
import { ExtraMaterialService } from '../../../../../services/extra-material';
import { LessonService } from '../../../../../services/lesson';
import { ExtraMaterialType } from '../../../../../../models/extra-material/extra-material';

describe('TabExtraMaterial', () => {
    let component: TabExtraMaterial;
    let fixture: ComponentFixture<TabExtraMaterial>;
    let mockExtraMaterialService: any;
    let mockLessonService: any;

    beforeEach(async () => {
        mockExtraMaterialService = {
            getExtraMaterialsByLessonId: jasmine.createSpy().and.returnValue(Promise.resolve([
                { id: 'mat-1', title: 'Doc 1', type: ExtraMaterialType.URL, url: 'https://example.com/1' },
                { id: 'mat-2', title: 'Doc 2', type: ExtraMaterialType.URL, url: 'https://example.com/2' }
            ])),
            upsertExtraMaterials: jasmine.createSpy().and.returnValue(Promise.resolve()),
            deleteExtraMaterials: jasmine.createSpy().and.returnValue(Promise.resolve()),
        };

        mockLessonService = {
            getLessonById: jasmine.createSpy().and.returnValue(Promise.resolve(null)),
            invalidateLesson: jasmine.createSpy().and.returnValue(Promise.resolve()),
        };

        await TestBed.configureTestingModule({
            imports: [TabExtraMaterial, ReactiveFormsModule],
            providers: [
                { provide: ExtraMaterialService, useValue: mockExtraMaterialService },
                { provide: LessonService, useValue: mockLessonService },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TabExtraMaterial);
        component = fixture.componentInstance;

        // set dummy lessonId to trigger effect
        fixture.componentRef.setInput('lessonId', 'lesson-1');
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('loads and displays saved extra materials', () => {
        expect(mockExtraMaterialService.getExtraMaterialsByLessonId).toHaveBeenCalledWith('lesson-1');
        expect(component.materials.length).toBe(2);
        expect(component.materials.at(0).get('title')?.value).toBe('Doc 1');
        expect(component.materials.at(1).get('title')?.value).toBe('Doc 2');
    });

    it('displays empty state when no extra materials are saved', async () => {
        mockExtraMaterialService.getExtraMaterialsByLessonId.and.returnValue(Promise.resolve([]));

        // Reload materials
        await component.loadExtraMaterials('lesson-1');
        fixture.detectChanges();

        expect(component.materials.length).toBe(0);

        const compiled = fixture.nativeElement as HTMLElement;
        const emptyState = compiled.querySelector('.empty-state');
        expect(emptyState).toBeTruthy();
        expect(compiled.textContent).toContain('Nenhum material de apoio ainda');
    });

    it('adds extra materials locally', () => {
        const initialCount = component.materials.length;

        component.addMaterial();

        expect(component.materials.length).toBe(initialCount + 1);
        const newGroup = component.materials.at(initialCount);
        expect(newGroup.get('title')?.value).toBe('');
        expect(newGroup.get('type')?.value).toBe(ExtraMaterialType.URL);
    });

    it('removes extra materials locally and schedules them for deletion if they existed', () => {
        expect(component.materials.length).toBe(2);

        // Remove first material which exists in DB
        component.removeMaterial(0);

        expect(component.materials.length).toBe(1);
        expect(component.materials.at(0).get('title')?.value).toBe('Doc 2');
    });

    it('requires non-empty title and valid URL', () => {
        component.addMaterial();
        const newGroup = component.materials.at(2);

        const titleControl = newGroup.get('title');
        const urlControl = newGroup.get('url');

        // Test title validation
        titleControl?.setValue('');
        expect(titleControl?.valid).toBeFalse();
        expect(titleControl?.errors?.['required']).toBeTrue();

        titleControl?.setValue('Some Title');
        expect(titleControl?.valid).toBeTrue();

        // Test URL validation
        urlControl?.setValue('');
        expect(urlControl?.valid).toBeFalse();
        expect(urlControl?.errors?.['required']).toBeTrue();

        urlControl?.setValue('invalid-url');
        expect(urlControl?.valid).toBeFalse();
        expect(urlControl?.errors?.['pattern']).toBeTruthy();

        urlControl?.setValue('https://valid.com');
        expect(urlControl?.valid).toBeTrue();
    });

    it('saves changes to database', async () => {
        // Add a new material and edit an existing one
        component.addMaterial();
        component.materials.at(2).get('title')?.setValue('New Doc');
        component.materials.at(2).get('url')?.setValue('https://example.com/new');

        component.materials.at(0).get('title')?.setValue('Updated Doc 1');

        // Remove the second material
        component.removeMaterial(1); // Removes 'mat-2'

        expect(component.form.valid).toBeTrue();

        await component.save();

        expect(mockExtraMaterialService.deleteExtraMaterials).toHaveBeenCalledWith(['mat-2']);
        expect(mockExtraMaterialService.upsertExtraMaterials).toHaveBeenCalled();
    });

    describe('JSON import', () => {
        it('opens the import modal when openImportModal is called', () => {
            expect(component.isImportModalOpen()).toBeFalse();

            component.openImportModal();

            expect(component.isImportModalOpen()).toBeTrue();
        });

        it('does not show the Importar JSON button when lessonId is null', async () => {
            fixture.componentRef.setInput('lessonId', null);
            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const btn = compiled.querySelector('#import-json-btn');
            expect(btn).toBeNull();
        });

        it('renders the modal elements when the modal is open', async () => {
            component.openImportModal();
            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            expect(compiled.querySelector('textarea[aria-label="Editor JSON de materiais extras"]')).toBeTruthy();
            expect(compiled.querySelector('#import-extra-cancel-btn')).toBeTruthy();
            expect(compiled.querySelector('#import-extra-submit-btn')).toBeTruthy();
            expect(compiled.textContent).toContain('Importar Materiais via JSON');
        });

        it('shows an error and keeps modal open when JSON is syntactically invalid', () => {
            component.openImportModal();
            component.updateImportJson('{ not valid json }}}');

            component.importFromJson();

            expect(component.importError()).not.toBeNull();
            expect(component.isImportModalOpen()).toBeTrue();
        });

        it('shows an error when the JSON payload is not an array', () => {
            component.openImportModal();
            component.updateImportJson(JSON.stringify({ title: 'test', url: 'https://example.com' }));

            component.importFromJson();

            expect(component.importError()).not.toBeNull();
            expect(component.importError()).toContain('array');
        });

        it('shows an error identifying the item when a title is missing or empty', () => {
            component.openImportModal();
            component.updateImportJson(JSON.stringify([
                { title: 'Valid', url: 'https://valid.com' },
                { title: '', url: 'https://example.com' }
            ]));

            component.importFromJson();

            expect(component.importError()).not.toBeNull();
            expect(component.importError()).toContain('2');
            expect(component.importError()).toContain('title');
        });

        it('shows an error identifying the item when a URL is missing or invalid', () => {
            component.openImportModal();
            component.updateImportJson(JSON.stringify([
                { title: 'Valid', url: 'https://valid.com' },
                { title: 'Bad URL', url: 'not-a-url' }
            ]));

            component.importFromJson();

            expect(component.importError()).not.toBeNull();
            expect(component.importError()).toContain('2');
            expect(component.importError()).toContain('url');
        });

        it('populates the FormArray and closes the modal on a valid import', () => {
            component.openImportModal();
            component.updateImportJson(JSON.stringify([
                { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
                { title: 'W3Schools', url: 'https://www.w3schools.com' }
            ]));

            component.importFromJson();

            expect(component.isImportModalOpen()).toBeFalse();
            expect(component.materials.length).toBe(2);
            expect(component.materials.at(0).get('title')?.value).toBe('MDN Web Docs');
            expect(component.materials.at(0).get('url')?.value).toBe('https://developer.mozilla.org');
            expect(component.materials.at(1).get('title')?.value).toBe('W3Schools');
            expect(component.importError()).toBeNull();
        });

        it('closes the modal and resets state without changing the materials list when cancelled', () => {
            const countBefore = component.materials.length;

            component.openImportModal();
            component.updateImportJson('[{"title":"Test","url":"https://test.com"}]');

            component.closeImportModal();

            expect(component.isImportModalOpen()).toBeFalse();
            expect(component.importRawJson()).toBe('');
            expect(component.importError()).toBeNull();
            expect(component.materials.length).toBe(countBefore);
        });
    });
});
