import { TestBed } from '@angular/core/testing';
import { CodeEditorService } from '@ngstack/code-editor';
import { MonacoLoader } from './monaco-loader';

describe('MonacoLoader', () => {
    let editor: { baseUrl: string; loadEditor: jasmine.Spy };
    let fetchSpy: jasmine.Spy;
    let loader: MonacoLoader;

    beforeEach(() => {
        editor = { baseUrl: 'https://cdn.test/monaco/min', loadEditor: jasmine.createSpy('loadEditor').and.resolveTo() };
        fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response());
        TestBed.configureTestingModule({ providers: [{ provide: CodeEditorService, useValue: editor }] });
        loader = TestBed.inject(MonacoLoader);
    });

    it('loads the editor once and reuses the result', async () => {
        expect(await loader.ensureLoaded()).toBeTrue();
        expect(await loader.ensureLoaded()).toBeTrue();

        expect(editor.loadEditor).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('https://cdn.test/monaco/min/vs/loader.js', { mode: 'no-cors' });
    });

    it('shares one load between concurrent callers', async () => {
        const results = await Promise.all([loader.ensureLoaded(), loader.ensureLoaded()]);

        expect(results).toEqual([true, true]);
        expect(editor.loadEditor).toHaveBeenCalledTimes(1);
    });

    it('fails fast, without loading the editor, when the CDN is unreachable', async () => {
        fetchSpy.and.rejectWith(new TypeError('Failed to fetch'));

        expect(await loader.ensureLoaded()).toBeFalse();
        expect(editor.loadEditor).not.toHaveBeenCalled();
    });

    it('reports failure when the editor load rejects and allows a retry', async () => {
        editor.loadEditor.and.rejectWith(new Error('boom'));
        expect(await loader.ensureLoaded()).toBeFalse();

        editor.loadEditor.and.resolveTo();
        expect(await loader.ensureLoaded()).toBeTrue();
    });

    it('gives up when the editor never finishes loading', async () => {
        jasmine.clock().install();
        try {
            editor.loadEditor.and.returnValue(new Promise(() => {}));
            const result = loader.ensureLoaded();
            await Promise.resolve();
            await Promise.resolve();
            jasmine.clock().tick(15001);

            expect(await result).toBeFalse();
        } finally {
            jasmine.clock().uninstall();
        }
    });
});
