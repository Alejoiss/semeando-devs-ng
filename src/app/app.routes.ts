import { Routes } from '@angular/router';
import { authGuard } from './components/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home'
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/landing-page/landing-page').then((m) => m.LandingPage),
        title: 'Semeando Devs | Home'
    },
    {
        path: 'auth/login',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
        title: 'Semeando Devs | Login'
    },
    {
        path: 'auth/register',
        loadComponent: () => import('./pages/register/register').then((m) => m.Register),
        title: 'Semeando Devs | Cadastro'
    },
    {
        path: 'recuperar-senha',
        loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
        title: 'Recuperar Senha - Semeando Devs'
    },
    {
        path: 'redefinir-senha',
        loadComponent: () => import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
        title: 'Redefinir Senha - Semeando Devs'
    },
    {
        path: 'support/contact',
        loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
        title: 'Semeando Devs | Contato'
    },
    {
        path: 'termos-de-uso',
        loadComponent: () => import('./pages/terms-of-use/terms-of-use').then((m) => m.TermsOfUse),
        title: 'Semeando Devs | Termos de Uso'
    },
    {
        path: 'app',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/app/app').then((m) => m.App),
        title: 'Semeando Devs | App',
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/app/modules/modules').then((m) => m.Modules),
                title: 'Semeando Devs | Módulos'
            },
            {
                path: 's/:slug',
                loadComponent: () => import('./pages/app/submodule/submodule').then((m) => m.Submodule),
                title: 'Semeando Devs | Submódulo'
            },
            {
                path: 's/:slug/ss/:slugSubmodule',
                loadComponent: () => import('./pages/app/submodule-detail/submodule-detail').then((m) => m.SubmoduleDetail),
                title: 'Semeando Devs | Submódulo Detalhe'
            },
            {
                path: 's/:slug/ss/:slugSubmodule/lesson/:lessonId',
                loadComponent: () => import('./pages/app/lesson/lesson').then((m) => m.Lesson),
                title: 'Semeando Devs | Aula'
            },
            {
                path: 's/:slug/ss/:slugSubmodule/lesson/:lessonId/quiz',
                loadComponent: () => import('./pages/app/quiz/quiz').then((m) => m.Quiz),
                title: 'Semeando Devs | Quiz'
            },
            {
                path: 's/:slug/finished',
                loadComponent: () => import('./pages/app/module-finished/module-finished/module-finished').then((m) => m.ModuleFinished),
                title: 'Conclusão de Módulo - Semeando Devs'
            },
            {
                path: 'ranking',
                loadComponent: () => import('./pages/app/ranking/ranking').then((m) => m.Ranking),
                title: 'Semeando Devs | Ranking'
            },
            {
                path: 'conquistas',
                loadComponent: () => import('./pages/app/achievements/achievements').then((m) => m.Achievements),
                title: 'Semeando Devs | Conquistas'
            },
            {
                path: 'upgrade',
                loadComponent: () => import('./pages/app/upgrade/upgrade').then((m) => m.Upgrade),
                title: 'Semeando Devs | Assinatura PRO'
            }
        ]
    }
];
