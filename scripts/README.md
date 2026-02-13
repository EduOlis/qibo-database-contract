# Scripts de Teste - TCM Knowledge Base Pipeline

Este diretório contém scripts auxiliares para testar o pipeline de processamento de documentos.

## Pré-requisitos

### Chave de API do LLM

As edge functions do pipeline precisam de acesso a um modelo LLM. Por padrão, usa Google Gemini.

Configure no Supabase:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Edge Functions** → **Manage secrets**
3. Adicione: `GEMINI_API_KEY` com sua chave do Google AI

Para usar outros providers (OpenAI, Anthropic), veja `LLM_CONFIGURATION.md`

## Configuração

### 1. Obter Token de Teste

Se você ainda não tem um usuário de teste configurado, execute:

```bash
npm run get-token
```

Este script irá:
- Criar um usuário de teste (test@tcmknowledge.com)
- Fazer login automaticamente
- Exibir o token de acesso
- Salvar as informações no arquivo `.env`

**Credenciais de teste criadas:**
- Email: `test@tcmknowledge.com`
- Senha: `TestPassword123!`

### 2. Variáveis de Ambiente

As seguintes variáveis devem estar no arquivo `.env`:

```env
VITE_SUPABASE_URL=<sua-url-supabase>
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
TEST_USER_TOKEN=<token-obtido-do-script-acima>
TEST_USER_ID=<user-id-obtido-do-script-acima>
```

## Uso do Script de Teste do Pipeline

### Listar Fontes Disponíveis

```bash
npm run test-pipeline list
```

Lista todas as fontes (documentos) disponíveis no banco de dados com seus IDs.

### Testar Etapa Individual

Execute uma etapa específica do pipeline:

```bash
# P0 - Chunking (divide documento em pedaços)
npm run test-pipeline p0 <source_id>

# A0 - Evidence Extraction (extrai evidências dos chunks)
npm run test-pipeline a0 <source_id>

# A1 - Clustering (agrupa evidências relacionadas)
npm run test-pipeline a1 <source_id>

# A2 - Tension Detection (detecta tensões/conflitos)
npm run test-pipeline a2 <source_id>
```

### Executar Pipeline Completo

Execute todas as etapas sequencialmente:

```bash
npm run test-pipeline full <source_id>
```

Isso executará: P0 → A0 → A1 → A2

## Exemplos

```bash
# 1. Listar fontes
npm run test-pipeline list

# 2. Ver resultado, copiar um source_id e testar só o P0
npm run test-pipeline p0 abc123-def456-...

# 3. Testar pipeline completo
npm run test-pipeline full abc123-def456-...
```

## Criar Documento de Teste

Se você não tem nenhum documento no banco, pode criar um documento de teste:

```bash
npm run create-test-source
```

Este script irá:
- Criar uma fonte de teste sobre "Deficiência de Qi do Baço"
- Criar 3 chunks de exemplo
- Inicializar o status do pipeline
- Exibir o `source_id` para uso nos testes

## Fluxo Típico de Teste

### Opção 1: Com Documento de Teste

1. **Criar documento de teste**:
   ```bash
   npm run create-test-source
   ```
2. **Copiar o source_id** exibido e testar:
   ```bash
   npm run test-pipeline full <source_id>
   ```

### Opção 2: Com Documento Real

1. **Upload de documento** através da interface web
2. **Listar fontes** para obter o `source_id`:
   ```bash
   npm run test-pipeline list
   ```
3. **Testar P0** (chunking) primeiro:
   ```bash
   npm run test-pipeline p0 <source_id>
   ```
4. **Testar A0** (extraction):
   ```bash
   npm run test-pipeline a0 <source_id>
   ```
5. **Testar A1** (clustering):
   ```bash
   npm run test-pipeline a1 <source_id>
   ```
6. **Testar A2** (tensions):
   ```bash
   npm run test-pipeline a2 <source_id>
   ```

Ou simplesmente:

```bash
npm run test-pipeline full <source_id>
```

## Autenticação

Todos os scripts usam o `TEST_USER_TOKEN` do arquivo `.env` para autenticação. Este token:
- É válido por 1 hora por padrão
- Pode ser renovado executando `npm run get-token` novamente
- Usa o usuário de teste criado automaticamente

## Troubleshooting

### Erro de autenticação
Se você receber erros de autenticação:
1. Execute `npm run get-token` para obter um novo token
2. Copie o novo token para o `.env`

### Source ID não encontrado
Se você receber erro de source_id não encontrado:
1. Execute `npm run test-pipeline list` para ver os IDs disponíveis
2. Certifique-se de ter feito upload de um documento pela interface

### RLS (Row Level Security)
Os scripts usam autenticação, então respeitam todas as políticas de RLS configuradas no banco de dados.
