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

- diagnóstico geral com pontuação de proteção;
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
3. Arraste o relatório DMARC para a área indicada ou clique em **Escolher arquivo**.
4. Consulte o diagnóstico, as fontes de envio e as ações recomendadas.

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
Arquivo selecionado
       ↓
Descompactação em memória
       ↓
Validação e leitura do XML
       ↓
Análise de DKIM, SPF e política DMARC
       ↓
Diagnóstico visual e ações recomendadas
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

Provedores fora dessa lista continuam sendo analisados normalmente e recebem uma identificação visual genérica baseada no nome da organização. Os logos conhecidos são carregados do pacote [Simple Icons](https://simpleicons.org/) via CDN; se não houver conexão, o painel utiliza automaticamente o monograma local.

## Estrutura do projeto

```text
painel-reporte-dominio/
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── theme.css
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
- apenas os logos de provedores conhecidos podem ser solicitados ao CDN, sem envio do conteúdo do relatório.

## Tecnologias

- HTML5 semântico;
- CSS3 responsivo com temas claro e escuro;
- JavaScript moderno sem frameworks;
- File API, `DOMParser`, `DecompressionStream` e `MutationObserver`.

## Aviso importante

O painel tem finalidade educativa e auxilia na interpretação do relatório. Antes de alterar registros DNS, SPF, DKIM ou políticas DMARC de um domínio em produção, valide a configuração com o responsável pela infraestrutura ou com o provedor de e-mail.

## Contribuindo

Sugestões, correções e melhorias são bem-vindas por meio de *issues* e *pull requests*. Nunca anexe relatórios reais sem antes remover domínios, endereços IP, contatos e outros dados que possam ser sensíveis.

---

<div align="center">

**DMARC Simplificado**  
Powered by [São Barreto Consultoria TI](https://saobarreto.com.br)

</div>
