# Perfis de Execução P0 — Versão 1

Este documento define perfis de execução concretos do contrato P0. Cada perfil é uma instância auditável, versionada e determinística do pipeline de ingestão e chunking P0.

Nenhum perfil abaixo altera, flexibiliza ou reinterpreta o contrato P0. Eles apenas o instanciam sob restrições explícitas.

---

## Perfil de Execução P0: p0-pdf-text-v1

### Identificador
- **id:** `p0-pdf-text-v1`
- **status:** ativo
- **data_registro:** 2026-01-20

### Escopo
Este perfil implementa o contrato P0 exclusivamente para:
- **Formato:** PDF
- **Tipo de conteúdo:** texto digital embutido (não OCR)
- **Idioma:** qualquer (sem detecção ou normalização)

### Ferramentas
- **Parser primário:** pdftotext (Poppler)
- **Versão exata:** Poppler 23.x (versão fixada no ambiente)
- **Plataforma:** Linux x86_64

### Configuração Relevante
- Modo padrão de extração de texto
- Nenhuma flag de reconstrução semântica
- Nenhuma heurística de layout ativada

### Procedimento
1. Abertura do arquivo PDF local
2. Extração sequencial do texto conforme a ordem lógica do parser
3. Emissão direta do texto bruto para o mecanismo de chunking P0

### Garantias
- Nenhuma inferência semântica
- Nenhuma correção ortográfica ou textual
- Nenhuma normalização de idioma
- Ordem determinística sob mesmo arquivo, ferramenta e versão

### Não-Garantias
- Fidelidade visual ao layout original
- Preservação de colunas, tabelas ou gráficos
- Correção de erros estruturais do PDF

### Output Esperado
- Texto bruto linear
- Quebras de linha conforme emitidas pelo parser
- `page_reference` preenchido com numeração lógica de páginas

### Riscos Conhecidos
- PDFs com múltiplas colunas podem gerar ordem textual não intuitiva
- PDFs mal estruturados podem produzir texto fragmentado

---

## Perfil de Execução P0: p0-kindle-text-v1

### Identificador
- **id:** `p0-kindle-text-v1`
- **status:** ativo
- **data_registro:** 2026-01-20

### Escopo
Este perfil implementa o contrato P0 exclusivamente para:
- **Formato:** Kindle (AZW3 ou KFX previamente convertidos)
- **Tipo de conteúdo:** texto digital
- **Idioma:** qualquer (sem detecção ou normalização)

### Ferramentas
- **Ferramenta primária:** Calibre ebook-convert
- **Versão exata:** Calibre 7.x (versão fixada no ambiente)
- **Plataforma:** Linux x86_64

### Configuração Relevante
- Conversão para texto simples (TXT)
- Nenhuma reconstrução semântica
- Nenhuma normalização tipográfica

### Procedimento
1. Recebimento de arquivo Kindle sem DRM (remoção fora do P0)
2. Conversão determinística para texto simples
3. Emissão direta do texto bruto para o mecanismo de chunking P0

### Garantias
- Nenhuma inferência semântica
- Nenhuma reorganização de capítulos
- Nenhuma limpeza linguística
- Output determinístico sob mesmo arquivo, ferramenta e versão

### Não-Garantias
- Preservação exata da paginação original
- Fidelidade a índices, sumários ou notas de rodapé
- Equivalência entre diferentes ferramentas de conversão

### Output Esperado
- Texto bruto linear
- Quebras conforme emitidas pela ferramenta
- `page_reference` opcional e não normativo

### Riscos Conhecidos
- Alterações silenciosas entre versões do Calibre
- Perda de marcações estruturais do livro

---

## Perfil de Execução P0: p0-web-html-static-v1

### Identificador
- **id:** `p0-web-html-static-v1`
- **status:** ativo
- **data_registro:** 2026-01-20

### Escopo
Este perfil implementa o contrato P0 exclusivamente para:
- **Fonte:** URL HTTP/HTTPS
- **Tipo de conteúdo:** HTML estático
- **Escopo:** uma única página explicitamente informada
- **Idioma:** qualquer (sem detecção ou normalização)

### Ferramentas
- **Cliente HTTP:** curl
- **Versão exata:** curl 8.x (versão fixada no ambiente)
- **Parser HTML:** BeautifulSoup
- **Plataforma:** Linux x86_64

### Configuração Relevante
- User-Agent fixo e versionado
- Nenhum cookie persistente
- Nenhuma execução de JavaScript

### Procedimento
1. Requisição HTTP GET para o URL informado
2. Captura do HTML retornado na resposta
3. Remoção apenas de tags `<script>` e `<style>`
4. Extração do texto conforme ordem linear do DOM
5. Emissão direta do texto bruto para o mecanismo de chunking P0

### Garantias
- Nenhum crawling ou navegação adicional
- Nenhuma inferência semântica
- Nenhuma limpeza heurística de conteúdo
- Texto corresponde exclusivamente ao HTML retornado naquele fetch

### Não-Garantias
- Estabilidade do conteúdo ao longo do tempo
- Fidelidade ao texto visível após execução de JavaScript
- Remoção de menus, rodapés ou banners

### Output Esperado
- Texto bruto linear extraído do HTML
- `page_reference` preenchido com o URL
- Timestamp de ingestão obrigatório

### Riscos Conhecidos
- Conteúdo dependente de headers ou geolocalização
- Páginas que exigem JavaScript podem retornar texto incompleto
- Alterações futuras no conteúdo do mesmo URL

---

## Registro de Versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0.0 | 2026-01-20 | Registro inicial dos três perfis de execução P0 |

---

## Critério de Auditoria

Um auditor técnico deve conseguir responder:

**"Com que ferramentas, versões e limites este P0 rodou?"**

- Sem olhar código
- Sem inferir comportamento
- Apenas lendo contratos e perfis

---

## Notas Importantes

1. **Estes perfis não alteram o contrato P0.** Eles apenas o instanciam com ferramentas e limites explícitos.

2. **Cada execução do P0 deve registrar qual perfil foi usado.** O identificador do perfil (`profile_id`) deve estar presente nos logs de execução.

3. **Alterações de versão de ferramenta exigem novo perfil.** Mudanças em Poppler, Calibre ou outras dependências exigem registro de novo perfil com novo identificador.

4. **Este documento é imutável após publicação.** Novos perfis devem ser adicionados em `p0_execution_profiles_v2.md` ou superior.
