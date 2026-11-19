import { Injectable, inject } from '@angular/core';
import { CodeEditorService } from '@ngstack/code-editor';

const LOAD_TIMEOUT_MS = 15000;

@Injectable({ providedIn: 'root' })
export class MonacoLoader {
    private readonly editorService = inject(CodeEditorService);
    private loaded = false;
    private pending: Promise<boolean> | null = null;

    ensureLoaded(): Promise<boolean> {
        if (this.loaded) {
            return Promise.resolve(true);
        }

        this.pending ??= this.load().then((ok) => {
            this.loaded = ok;
            this.pending = null;
            return ok;
        });
        return this.pending;
    }

    private async load(): Promise<boolean> {
        try {
            await fetch(`${this.editorService.baseUrl}/vs/loader.js`, { mode: 'no-cors' });
        } catch {
            return false;
        }

        const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), LOAD_TIMEOUT_MS));
        const loading = this.editorService.loadEditor().then(() => true, () => false);
        return Promise.race([loading, timeout]);
    }
}
