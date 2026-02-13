# Guia de Testes - Pipeline de Processamento

Este guia mostra como testar o pipeline de processamento de documentos usando autenticação.

## Configuração Inicial

### 1. Configurar OPENAI_API_KEY no Supabase

**IMPORTANTE:** As edge functions do pipeline (A0, A1, A2) precisam de acesso à API da OpenAI.

Para configurar:
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Edge Functions** → **Manage secrets**
3. Adicione a secret: `OPENAI_API_KEY` com sua chave da OpenAI
4. Aguarde alguns segundos para a atualização

Se você não tiver uma chave OpenAI:
- Crie uma conta em [platform.openai.com](https://platform.openai.com)
- Vá em API keys e crie uma nova chave
- Adicione créditos à sua conta se necessário

### 2. Obter Token de Autenticação

```bash
npm run get-token
```

Isso vai:
- Criar um usuário de teste: `test@tcmknowledge.com` / `TestPassword123!`
- Fazer login automaticamente
- Adicionar `TEST_USER_TOKEN` e `TEST_USER_ID` ao arquivo `.env`

### 3. Criar Documento de Teste

```bash
npm run create-test-source
```

Isso vai criar:
- Uma fonte de teste no banco de dados
- 3 chunks de exemplo sobre "Deficiência de Qi do Baço"
- Status inicial do pipeline

O script vai exibir o `source_id` que você usará nos próximos comandos.

## Testando o Pipeline

### Listar Fontes Disponíveis

```bash
npm run test-pipeline list
```

### Testar Etapas Individuais

```bash
# A0 - Extrair evidências dos chunks
npm run test-pipeline a0 <source_id>

# A1 - Agrupar evidências em clusters
npm run test-pipeline a1 <source_id>

# A2 - Detectar tensões/conflitos
npm run test-pipeline a2 <source_id>
```

### Testar Pipeline Completo

```bash
npm run test-pipeline full <source_id>
```

Executa: A0 → A1 → A2 sequencialmente

## Exemplo Completo

```bash
# 1. Configure o token de autenticação
npm run get-token

# 2. Crie um documento de teste
npm run create-test-source
# Anote o source_id que aparece no final

# 3. Liste as fontes para confirmar
npm run test-pipeline list

# 4. Teste o pipeline completo
npm run test-pipeline full abc123-def456-...
```

## Estrutura dos Scripts

```
scripts/
├── README.md                  # Documentação detalhada dos scripts
├── get-test-token.js         # Obtém token de autenticação
├── create-test-source.js     # Cria documento de teste
└── test-pipeline.js          # Testa o pipeline
```

## Sobre a Autenticação

**Por que usar autenticação nos testes?**

O banco de dados usa Row Level Security (RLS) em todas as tabelas. Sem autenticação:
- Não é possível criar ou ler dados
- As edge functions rejeitam requisições não autenticadas

**Como funciona:**

1. Um usuário de teste é criado no Supabase Auth
2. O token de acesso é armazenado em `TEST_USER_TOKEN` no `.env`
3. Os scripts usam esse token para fazer chamadas autenticadas
4. O token expira após 1 hora (basta executar `npm run get-token` novamente)

## Verificando Resultados

Após executar o pipeline, você pode verificar os resultados:

### No Banco de Dados

```sql
-- Ver evidências extraídas
SELECT * FROM kb_evidence_excerpts WHERE source_id = '<source_id>';

-- Ver clusters criados
SELECT * FROM kb_evidence_clusters WHERE source_id = '<source_id>';

-- Ver tensões detectadas
SELECT * FROM kb_textual_tensions WHERE source_id = '<source_id>';

-- Ver status do pipeline
SELECT * FROM kb_document_pipeline_status WHERE source_id = '<source_id>';
```

### Na Interface Web

Acesse a interface web e navegue até:
- **Documents** - Ver documentos processados
- **Evidences** - Ver evidências extraídas
- **Validation** - Revisar e aprovar evidências

## Troubleshooting

### Token Expirado

Se você receber erro 401 (Unauthorized):

```bash
npm run get-token
```

### Nenhuma Fonte Disponível

Se `npm run test-pipeline list` não mostrar nada:

```bash
npm run create-test-source
```

### Edge Function Não Encontrada

Certifique-se de que as edge functions estão deployadas:
- `process-p0`
- `process-a0`
- `process-a1`
- `process-a2`

### Erro de RLS

Se você receber erro de "new row violates row-level security policy":
- Verifique se o token está correto no `.env`
- Execute `npm run get-token` para obter um novo token
- Certifique-se de que o usuário de teste existe

## Próximos Passos

Depois de validar que o pipeline funciona com dados de teste:

1. **Upload de documentos reais** através da interface
2. **Processar documentos** usando os scripts
3. **Validar resultados** na interface de revisão
4. **Iterar e melhorar** baseado nos resultados

Para adicionar autenticação na interface web posteriormente, veja: `src/lib/supabase.ts`
