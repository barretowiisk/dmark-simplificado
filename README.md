# DMARC Simplificado

> Relatórios técnicos de e-mail traduzidos em respostas claras, visuais e acionáveis.

O **DMARC Simplificado** é um painel web gratuito para leitura de relatórios agregados DMARC de diferentes provedores. Arraste um arquivo `.xml`, `.xml.gz` ou `.zip` e a aplicação apresenta, em português, o estado da autenticação, as fontes de envio, possíveis falhas e ações recomendadas.

Todo o processamento acontece **localmente no navegador**. Nenhum relatório é enviado, armazenado ou compartilhado com servidores.

## Recursos

- resumo visual com pontuação e diagnóstico geral;
- volume de mensagens, percentual autenticado e fontes com atenção;
- leitura das políticas `none`, `quarantine` e `reject`;
- detalhamento por IP com resultados DKIM, SPF e disposição;
- recomendações em linguagem simples e glossário técnico;
- suporte a XML, GZIP e ZIP, sem backend ou banco de dados;
- layout responsivo para desktop e celular.
- temas claro e escuro, respeitando a preferência do sistema e salvando a escolha localmente.

## Executar localmente

Clone o repositório e abra `index.html` em um navegador moderno. Você também pode iniciar um servidor local:

```bash
python -m http.server 8080
```

Acesse `http://localhost:8080` e envie um relatório. O repositório inclui o arquivo de exemplo `zohomail.com!saobarreto.com.br!1793170800!1793257200.xml.gz`.

## Estrutura

```text
├── index.html
├── assets/
│   ├── css/style.css
│   ├── css/theme.css
│   └── js/app.js
├── zohomail.com!...xml.gz
└── README.md
```

## Como funciona

1. O navegador lê e descompacta o arquivo em memória.
2. O XML é validado e interpretado sem sair do dispositivo.
3. Cada registro é avaliado pelo alinhamento DKIM/SPF e pela política DMARC.
4. O painel gera métricas, diagnóstico e orientações compatíveis com o resultado.

ZIPs devem conter ao menos um `.xml`. A leitura usa o diretório central do pacote e aceita arquivos gerados por diferentes provedores, inclusive os que utilizam *data descriptor*.

## Provedores

O formato de relatório agregado DMARC é padronizado. O painel não depende do nome do arquivo ou de um remetente específico e interpreta relatórios compatíveis enviados por Google, Zoho, Microsoft, Yahoo e outros provedores.

## Privacidade e compatibilidade

A aplicação usa `DOMParser`, File API e `DecompressionStream` e funciona melhor nas versões recentes de Chrome, Edge, Firefox e Safari. As orientações são educativas; valide alterações de DNS, SPF, DKIM ou DMARC com seu provedor de e-mail.

## Contribuindo

Contribuições são bem-vindas por meio de *issues* e *pull requests*. Nunca publique relatórios reais com informações sensíveis sem anonimização.

## Licença

Considere adicionar uma licença antes da publicação pública (por exemplo, MIT). Sem um arquivo `LICENSE`, todos os direitos permanecem reservados ao autor.
