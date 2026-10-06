import { importProvidersFrom, mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CodeEditorModule } from '@ngstack/code-editor';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// O CodeEditorModule carrega o Monaco via `window` num APP_INITIALIZER, então fica fora da config compartilhada com a pré-renderização
const browserConfig = mergeApplicationConfig(appConfig, {
    providers: [importProvidersFrom(CodeEditorModule.forRoot())],
});

bootstrapApplication(App, browserConfig)
  .catch((err) => console.error(err));
