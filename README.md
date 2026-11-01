<div align="center">

# DMARC Simplificado

### Transforme relatórios técnicos de e-mail em decisões claras.

Um painel moderno, privado e fácil de usar para interpretar relatórios agregados DMARC diretamente no navegador.

![HTML](https://img.shields.io/badge/HTML5-semântico-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-responsivo-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-sem_dependências-F7DF1E?logo=javascript&logoColor=111)
![Privacidade](https://img.shields.io/badge/privacidade-processamento_local-17A873)

</div>

---

## Sobre o projeto

Relatórios DMARC costumam chegar como arquivos compactados repletos de informações técnicas. O **DMARC Simplificado** transforma esses dados em uma experiência visual e acessível: você seleciona o relatório e recebe um diagnóstico com métricas, explicações e próximos passos.

O arquivo é processado localmente. Seu conteúdo não é enviado, armazenado ou compartilhado com nenhum servidor.

## Destaques

- indicadores independentes de saúde da autenticação e nível da política DMARC;
- upload de até 100 relatórios por lote, respeitando o limite total de 50 MB;
- visão consolidada por período, domínio e provedor;
- detecção de arquivos duplicados e aviso sobre períodos sobrepostos;
- filtros por domínio, provedor e resultado de autenticação;
- detalhamento expansível de cada relatório processado;
- volume de mensagens e taxa de autenticação;
- resultados DKIM e SPF detalhados por IP;
- interpretação das políticas `none`, `quarantine` e `reject`;
- recomendações práticas em linguagem simples;
- identificação visual de provedores conhecidos;
- suporte a relatórios de Google, Zoho, Microsoft, Yahoo e outros remetentes compatíveis;
- leitura de `.xml`, `.xml.gz` e `.zip`;
- temas claro e escuro com preferência salva;
- layout responsivo para computador, tablet e celular;
- funcionamento sem backend, banco de dados ou instalação de pacotes.

## Como usar

Não é necessário iniciar um servidor local.

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` em um navegador moderno.
3. Arraste um ou vários relatórios DMARC para a área indicada ou clique em **Escolher arquivos**.
4. Consulte a visão consolidada, aplique filtros e abra os detalhes de cada relatório quando necessário.

> Para descompactação no navegador, utilize uma versão recente do Chrome, Edge, Firefox ou Safari.

## Formatos aceitos

| Formato | Descrição |
| --- | --- |
| `.xml` | Relatório DMARC já descompactado |
| `.xml.gz` | Formato GZIP comum em anexos de relatórios |
| `.zip` | Pacote ZIP contendo ao menos um arquivo XML |

O leitor utiliza o diretório central do ZIP e aceita variações comuns de compactação, inclusive pacotes com *data descriptor*.

## Como a análise funciona

```text
Arquivos selecionados
       ↓
Descompactação em memória
       ↓
Validação e leitura do XML
       ↓
Deduplicação e identificação de períodos sobrepostos
       ↓
Análise de DKIM, SPF e política DMARC
       ↓
Consolidação ponderada pelo volume de mensagens
       ↓
Diagnóstico, filtros e ações recomendadas
```

A lógica segue a estrutura padronizada dos relatórios agregados DMARC. O reconhecimento não depende do nome do arquivo nem de um provedor específico.

## Provedores reconhecidos visualmente

O painel possui identificação para provedores conhecidos, incluindo:

- Google;
- Zoho Mail;
- Microsoft e Outlook;
- Yahoo;
- Cloudflare;
- Fastmail;
- Proton Mail;
- Amazon Web Services;
- Apple;
- Mail.ru.

Provedores fora dessa lista continuam sendo analisados normalmente e recebem uma identificação visual genérica baseada no nome da organização. Os SVGs disponíveis estão incorporados ao projeto e as demais marcas usam monogramas locais. Nenhuma logo é solicitada a serviços externos durante a consulta.

## Estrutura do projeto

```text
painel-reporte-dominio/
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── theme.css
│   │   └── batch.css
│   ├── images/
│   │   └── providers/
│   └── js/
│       ├── app.js
│       └── provider.js
├── .gitignore
└── README.md
```

Os relatórios usados durante o desenvolvimento não fazem parte do projeto. Arquivos `*.zip` e `*.xml.gz` são ignorados pelo Git para reduzir o risco de publicação acidental de dados reais.

## Privacidade

- a leitura e a descompactação acontecem na memória do navegador;
- o conteúdo do XML não é transmitido;
- não há cadastro, cookies de rastreamento ou banco de dados;
- a preferência de tema é a única configuração salva localmente;
- todos os recursos necessários ao painel são locais; nenhuma chamada externa é feita durante a análise.

## Tecnologias

- HTML5 semântico;
- CSS3 responsivo com temas claro e escuro;
- JavaScript moderno sem frameworks;
- File API, `DOMParser`, `DecompressionStream` e `MutationObserver`.

## Recursos de marca

Os SVGs incorporados foram obtidos do projeto [Simple Icons](https://simpleicons.org/), disponibilizado sob CC0. Os nomes e marcas pertencem aos respectivos proprietários e são usados apenas para identificar a organização emissora do relatório.

## Aviso importante

O painel tem finalidade educativa e auxilia na interpretação do relatório. Antes de alterar registros DNS, SPF, DKIM ou políticas DMARC de um domínio em produção, valide a configuração com o responsável pela infraestrutura ou com o provedor de e-mail.

## Contribuindo

Sugestões, correções e melhorias são bem-vindas por meio de *issues* e *pull requests*. Nunca anexe relatórios reais sem antes remover domínios, endereços IP, contatos e outros dados que possam ser sensíveis.

---

<div align="center">

**DMARC Simplificado**  
Powered by [São Barreto Consultoria TI](https://saobarreto.com.br)

</div>
