import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { PUBLIC_CATALOG_SOURCE } from './services/public-catalog/public-catalog.source';
import { snapshotCatalogSource } from './services/public-catalog/public-catalog.snapshot-source';

const serverConfig: ApplicationConfig = {
    providers: [
        provideServerRendering(withRoutes(serverRoutes)),
        { provide: PUBLIC_CATALOG_SOURCE, useValue: snapshotCatalogSource },
    ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
