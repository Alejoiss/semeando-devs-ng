Aqui está o passo a passo detalhado do que você precisa fazer no painel do Google AdSense para gerar as credenciais reais e substituí-las na implementação do projeto.

Etapa 1: Cadastro e Acesso ao Painel do Google AdSense
Acesse o site oficial do Google AdSense: https://www.google.com.br/adsense/start/
Clique em "Primeiros passos" (ou faça login com sua conta do Google associada à plataforma/empresa).
Preencha as informações iniciais, incluindo o endereço do seu site (ex: semeando.dev ou o seu domínio de staging/produção) e suas informações de pagamento.
Etapa 2: Adicionar e Verificar seu Domínio
O Google AdSense exige que você comprove a posse do domínio antes de veicular anúncios.

No menu lateral esquerdo do painel do AdSense, vá em "Sites".
Clique em "Adicionar site" e insira a URL limpa da sua plataforma (ex: `semeandodevs.com.
br>

Verificação do Domínio: O AdSense fornecerá um código de script ou um registro TXT de DNS.
Recomendado (Via DNS): Insira o registro TXT fornecido nas configurações de DNS do seu provedor de domínio (Cloudflare, GoDaddy, etc.). Isso evita ter que misturar códigos de verificação estáticos no repositório.
Aprovação: O Google analisará seu site (o que costuma levar de alguns dias a duas semanas) para garantir que ele segue as políticas do programa.
Etapa 3: Obter o seu ID de Cliente (Publisher ID)
O ID de cliente identifica a sua conta do AdSense.

No painel do AdSense, clique em "Conta" > "Configurações" > "Informações da conta".
Copie o valor exibido no campo "ID do editor" (Publisher ID). Ele terá o formato parecido com: ca-pub-XXXXXXXXXXXXXXXX (onde X são números).
Etapa 4: Criar os Blocos de Anúncio (Ad Slots)
Você precisa criar os dois blocos configurados no projeto: um para o cabeçalho e outro para o rodapé.

No painel esquerdo do AdSense, vá em "Anúncios".
Clique na aba "Por bloco de anúncios" na parte superior.
Selecione a opção "Anúncios display" (é a mais recomendada para banners adaptáveis).
Bloco do Cabeçalho (Header):
Dê o nome de: Semeando Devs - Header.
Defina o tamanho do anúncio como "Responsivo".
Clique em "Criar".
O AdSense gerará um bloco de código. Copie apenas o número contido no atributo data-ad-slot (ex: 1111111111).
Bloco do Rodapé (Footer):
Clique em "Criar novo bloco de anúncios display".
Dê o nome de: Semeando Devs - Footer.
Defina o tamanho do anúncio como "Responsivo".
Clique em "Criar".
Copie o número contido no atributo data-ad-slot gerado para este bloco (ex: 2222222222).
Etapa 5: Configurar as Credenciais no Projeto Semeando Devs
Com o ID do editor e os IDs dos dois slots gerados, insira-os no seu arquivo de ambiente correspondente (environment.prod.ts para produção e environment.ts para local se quiser testar em ambiente simulado):

1. Editar o arquivo src/environments/environment.prod.ts
Adicione as propriedades configuradas no AdsenseService:

typescript
export const environment = {
    production: true,
    supabaseUrl: 'https://sua-url-supabase.supabase.co',
    supabaseKey: 'sua-key-producao',
    mlPublicKey: 'sua-key-mercado-pago',
    urlBase: 'https://semeando.devs.com.br', // exemplo
    
    // Configurações reais do Google AdSense
    adsenseClient: 'ca-pub-SEU_PUBLISHER_ID_AQUI',
    adsenseHeaderSlot: 'ID_DO_SLOT_DE_CABECALHO_AQUI',
    adsenseFooterSlot: 'ID_DO_SLOT_DE_RODAPE_AQUI'
};
2. Se desejar usar credenciais diferentes em Staging ou Desenvolvimento:
Modifique environment.ts ou environment.staging.ts com os respectivos valores. O código que implementamos detectará esses campos automaticamente e usará os mocks anteriores como fallback seguro:

typescript
readonly adClient = (environment as any).adsenseClient || 'ca-pub-1234567890123456';
readonly headerAdSlot = (environment as any).adsenseHeaderSlot || '1111111111';
readonly footerAdSlot = (environment as any).adsenseFooterSlot || '2222222222';
Observação importante sobre LGPD / Cookies
O Google AdSense utiliza cookies para personalização de anúncios. Por padrão, em conformidade com as regras da União Europeia (GDPR) e leis brasileiras (LGPD), você precisará exibir um aviso/banner de consentimento de cookies na sua plataforma.

O próprio painel do Google AdSense oferece uma ferramenta nativa de consentimento (em "Privacidade e mensagens" > "GDPR/Regulamentos estaduais dos EUA"), que injeta automaticamente o banner de consentimento no seu site assim que o script do AdSense é executado.