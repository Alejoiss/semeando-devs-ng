import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabExtraMaterial } from './tab-extra-material';
import { ReactiveFormsModule } from '@angular/forms';
import { ExtraMaterialService } from '../../../../../services/extra-material';
import { ExtraMaterialType } from '../../../../../../models/extra-material/extra-material';

describe('TabExtraMaterial', () => {
    let component: TabExtraMaterial;
    let fixture: ComponentFixture<TabExtraMaterial>;
    let mockExtraMaterialService: any;

    beforeEach(async () => {
        mockExtraMaterialService = {
            getExtraMaterialsByLessonId: jasmine.createSpy().and.returnValue(Promise.resolve([
                { id: 'mat-1', title: 'Doc 1', type: ExtraMaterialType.URL, url: 'https://example.com/1' },
                { id: 'mat-2', title: 'Doc 2', type: ExtraMaterialType.URL, url: 'https://example.com/2' }
            ])),
            upsertExtraMaterials: jasmine.createSpy().and.returnValue(Promise.resolve()),
            deleteExtraMaterials: jasmine.createSpy().and.returnValue(Promise.resolve()),
        };

        await TestBed.configureTestingModule({
            imports: [TabExtraMaterial, ReactiveFormsModule],
            providers: [
                { provide: ExtraMaterialService, useValue: mockExtraMaterialService }
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
});
