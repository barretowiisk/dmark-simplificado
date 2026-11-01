# Changelog

Todas as mudanças relevantes do **DMARC Simplificado** são documentadas neste arquivo.

O projeto utiliza [Versionamento Semântico](https://semver.org/lang/pt-BR/), no formato `MAJOR.MINOR.PATCH`.

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
