# Changelog

Todas as mudanças relevantes do **DMARC Simplificado** são documentadas neste arquivo.

O projeto utiliza [Versionamento Semântico](https://semver.org/lang/pt-BR/), no formato `MAJOR.MINOR.PATCH`.

## [1.1.0] — 2026-11-01

### Adicionado

- suporte oficial à implantação no Cloudflare Workers com Static Assets;
- proxy DNS de mesma origem em `/api/dns`;
- validação de nomes DNS e restrição a consultas TXT;
- cache de 60 segundos para respostas DNS;
- fallback do Worker entre Cloudflare DNS e Google Public DNS;
- cabeçalhos de segurança para os arquivos hospedados;
- configuração `wrangler.jsonc` e proteção de assets via `.assetsignore`.

### Alterado

- o navegador consulta primeiro o proxy do próprio site;
- consultas diretas permanecem como fallback para desenvolvimento local;
- relatórios compactados, Git e arquivos internos são excluídos do deploy.

## [1.0.1] — 2026-11-01

### Corrigido

- consulta DNS alterada para tolerar falhas parciais;
- uma falha de seletor DKIM não cancela mais os resultados de DMARC e SPF;
- Google Public DNS definido como resolvedor principal, com Cloudflare como fallback;
- mensagens de erro agora exibem o motivo técnico da falha;
- timeout, política CORS explícita e cache desabilitado nas consultas;
- parâmetros de versão adicionados aos scripts para evitar JavaScript antigo no cache.

## [1.0.0] — 2026-11-01

### Adicionado

- leitura local de relatórios agregados DMARC em XML, GZIP e ZIP;
- upload individual ou em lote, com limite de 100 arquivos e 50 MB;
- consolidação ponderada por volume de mensagens;
- indicadores independentes de autenticação e política DMARC;
- detalhamento de DKIM, SPF, disposição e IPs de origem;
- filtros por domínio, provedor e resultado;
- detecção de duplicados e períodos sobrepostos;
- comparação opcional com os registros DNS atuais de DMARC, SPF e DKIM;
- Google Public DNS como resolvedor principal e Cloudflare como alternativa;
- identificação visual de provedores com recursos locais e fallback por monograma;
- temas claro e escuro com preferência armazenada localmente;
- favicon e identidade visual próprios;
- layout responsivo e documentação pública completa.

### Privacidade

- processamento dos relatórios inteiramente no navegador;
- nenhum backend, cadastro, banco de dados ou armazenamento remoto;
- arquivos e conteúdo XML nunca são transmitidos;
- consulta externa somente após ação explícita do usuário;
- arquivos de relatório ignorados pelo Git.

### Observações

- a análise dos arquivos funciona offline;
- a consulta DNS atual requer conexão com a internet;
- esta versão representa a primeira entrega pública estável do projeto.
