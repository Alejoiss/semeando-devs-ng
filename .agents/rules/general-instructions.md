---
trigger: always_on
---

# Instruções do Copilot para SeloClubeAdminNg

## Visão Geral do Projeto
- **Framework:** Angular 20+ (componentes standalone, Angular CLI). Sempre use o `angular-instructions.md` para detalhes específicos de Angular.
- **UI:** Tailwind CSS
- **Estrutura:**
    - `src/app/components/`: Componentes de UI compartilhados (ex: `internal-header`, `breadcrumb`, `aside-menu`)
    - `src/app/pages/`: Páginas de funcionalidades, agrupadas por domínio (ex: `home`, `login`, `company`, `campaigns`)
    - `src/app/models/`: Classes TypeScript para modelos de domínio (ex: `Campaign`, `Company`, `Plan`)
    - `src/app/services/`: Lógica de negócio e comunicação com API (um serviço por domínio)
    - `src/app/guards/`, `src/app/interceptors/`: Guards de rota e interceptadores HTTP
    - `src/environments/`: URLs de API e configurações de ambiente

## Padrões & Convenções Principais
- **Componentes Standalone:** Todos os componentes Angular usam o padrão `standalone: true` (veja o array `imports` no `@Component`).descrição e breadcrumbs.
- **Testes:** Cada componente/serviço/modelo possui um arquivo `.spec.ts` correspondente usando o TestBed do Angular.
- **Estilização:** Use classes Tailwind nos templates e `styles.scss` para overrides globais. Arquivo `design.md` para diretrizes de design.
- **Roteamento:** Guards de rota estão em `guards/`. Use os guards `profile-permission` e `logged-user` para controle de acesso.
- **Responsividade:** Utilize as classes utilitárias do Tailwind para garantir que a UI seja responsiva.
- **Máscaras de Formulário:** Utilize máscaras de entrada para campos como CPF/CNPJ, telefones e datas, garantindo a formatação correta dos dados. Quando possível, utilize bibliotecas como ngx-mask para facilitar a implementação.
- **Validadores de Formulário:** Utilize validadores reativos do Angular para garantir a integridade dos dados nos formulários. Crie validadores personalizados quando necessário para regras específicas de negócio. Os validadores criados, devem ser armazenados um arquivo 'src/utils/validators.ts', para facilitar a manutenção e reutilização.
- **Formatação**: Toda formatação de código deve ser feita seguindo o arquivo de configuração '.editorconfig' presente na raiz do projeto. Espaçamento padrão são de 4 espaços por nível de indentação.
- **Condicionais e Loops em Templates:** Use o novo sistema de diretivas estruturais do Angular (control flow) para condicionais e loops, garantindo melhor performance e legibilidade.
    - Todo loop deve utilizar a diretiva `@for` com a cláusula `track` para otimizar a renderização de listas.
    - Exemplos:
    ```html
    <!-- Não use  -->
    <div *ngFor="let item of items; trackBy: trackById">
        {{ item.name }}
    </div>

    <div *ngIf="isLoggedIn">
        <p>Bem-vindo, usuário!</p>
    </div>

    <!-- Use -->
    @for(let item of items; track item.id) {
        <div>
            {{ item.name }}
        </div>
    }

    @if(isLoggedIn) {
        <p>Bem-vindo, usuário!</p>
    }
    ```

## Fluxos de Trabalho do Desenvolvedor
- **Iniciar Servidor de Dev:** `ng serve` (ou `npm start`)
- **Rodar Testes Unitários:** `ng test` (ou `npm test`)
- **Build para Produção:** `ng build`
- **Testes E2E:** `ng e2e` (framework não incluído por padrão)
- **Gerar Componente:** `ng generate component <nome>`

## Integração & Fluxo de Dados
- **Serviços:** Cada domínio possui um serviço para chamadas de API, injetado em páginas/componentes.
- **Comunicação entre Componentes:** Use `@Input`/`@Output` para fluxo de dados entre componentes pai/filho.

## Dependências Externas
- **Tailwind CSS:** Estilização utilitária
- **Angular CLI:** Build/test/scaffold
- **Informações sobre o design system:** Consulte `.github/design.md` para diretrizes de design e estilo.

## Notas Especiais
- **Nenhum framework de teste end-to-end incluído por padrão.**
- **Todos os novos componentes devem ser standalone e importados explicitamente.**
