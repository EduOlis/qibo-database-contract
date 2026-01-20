# Proposta de Ajuste de Schema — kb_ingestion_logs

**Data:** 2026-01-20
**Documento:** Proposta de ajuste mínimo sem aplicação imediata
**Referência:** Contrato P0 v1.2.0, seção 10 (Logs de Execução)

---

## Contexto

O contrato P0 especifica campos obrigatórios para a tabela `kb_ingestion_logs` que atualmente não existem no schema.

Esta proposta documenta o ajuste necessário para conformidade total com o contrato P0.

---

## Estado Atual da Tabela kb_ingestion_logs

Campos existentes:
- `id` (uuid, PK)
- `source_id` (uuid, FK → kb_sources.id)
- `agent_name` (text)
- `agent_version` (text)
- `summary` (text, nullable)
- `warnings` (text, nullable)
- `created_at` (timestamptz)

---

## Campos Faltantes Conforme P0

Conforme seção 10 do contrato P0, os seguintes campos são **obrigatórios** mas estão ausentes:

1. **execution_profile** (text, NOT NULL)
   - Identifica qual perfil de execução P0 foi usado
   - Exemplos: `"p0-pdf-text-v1"`, `"p0-kindle-text-v1"`, `"p0-web-html-static-v1"`
   - Rastreabilidade: ferramentas, versões e limites usados

2. **operation_type** (text, NOT NULL)
   - Tipo de operação realizada
   - Conforme P0: `"ingestion_chunking"`

3. **status** (text, NOT NULL)
   - Estado final da operação
   - Valores permitidos: `"success"`, `"failed"`, `"skipped"`

4. **execution_time_ms** (integer, nullable)
   - Tempo de execução em milissegundos
   - Métrica de performance e auditoria

---

## Proposta de Migração SQL

```sql
/*
  # Ajuste de conformidade: kb_ingestion_logs

  1. Campos Adicionados
    - execution_profile: identifica o perfil P0 usado
    - operation_type: tipo de operação (ingestion_chunking)
    - status: resultado da execução (success/failed/skipped)
    - execution_time_ms: tempo de execução

  2. Conformidade
    - Atende completamente a seção 10 do contrato P0 v1.2.0
    - Habilita rastreamento determinístico de execuções
    - Suporta auditoria técnica sem inspeção de código
*/

-- Adicionar campo execution_profile
ALTER TABLE kb_ingestion_logs
ADD COLUMN IF NOT EXISTS execution_profile text;

-- Adicionar campo operation_type
ALTER TABLE kb_ingestion_logs
ADD COLUMN IF NOT EXISTS operation_type text;

-- Adicionar campo status
ALTER TABLE kb_ingestion_logs
ADD COLUMN IF NOT EXISTS status text;

-- Adicionar campo execution_time_ms
ALTER TABLE kb_ingestion_logs
ADD COLUMN IF NOT EXISTS execution_time_ms integer;

-- Adicionar constraints após popular dados existentes (se houver)
-- NOTA: Para registros antigos, pode-se usar valores sentinela como:
--   execution_profile = 'unknown-legacy'
--   operation_type = 'ingestion_chunking'
--   status = 'unknown'

-- Após migração de dados legados, aplicar NOT NULL onde necessário:
-- ALTER TABLE kb_ingestion_logs ALTER COLUMN execution_profile SET NOT NULL;
-- ALTER TABLE kb_ingestion_logs ALTER COLUMN operation_type SET NOT NULL;
-- ALTER TABLE kb_ingestion_logs ALTER COLUMN status SET NOT NULL;

-- Adicionar check constraint para status
ALTER TABLE kb_ingestion_logs
ADD CONSTRAINT IF NOT EXISTS kb_ingestion_logs_status_check
CHECK (status IN ('success', 'failed', 'skipped') OR status IS NULL);
```

---

## Justificativa

### 1. Rastreabilidade Determinística
O campo `execution_profile` é **crítico** para auditoria:
- Permite identificar exatamente quais ferramentas e versões foram usadas
- Viabiliza reprodução exata de execuções passadas
- Detecta mudanças não intencionais de perfil

### 2. Conformidade com P0
Sem esses campos, o sistema não atende ao contrato P0 v1.2.0.

### 3. Auditoria Sem Código
Um auditor deve poder responder:
> "Com que ferramentas, versões e limites este P0 rodou?"

Apenas consultando:
```sql
SELECT
  source_id,
  execution_profile,
  status,
  execution_time_ms,
  created_at
FROM kb_ingestion_logs
WHERE source_id = '<id>';
```

---

## Impacto

### Código Existente
- **Nenhum código de execução existe ainda**
- Código futuro deve popular esses campos obrigatoriamente

### Dados Existentes
- Tabela `kb_ingestion_logs` atualmente vazia (0 rows)
- Nenhuma migração de dados necessária

### Schema
- Adição de 4 colunas
- 1 constraint de validação
- Sem alteração de dados existentes

---

## Decisão

Esta proposta está **documentada mas não aplicada**.

Aplicação deve ocorrer:
- Antes da primeira execução de P0
- Como parte da preparação do ambiente de produção
- Com revisão de segurança e compliance

---

## Referências

1. Contrato P0 v1.2.0 — `/contracts/P0.md`, seção 10
2. Perfis de Execução P0 v1 — `/contracts/p0_execution_profiles_v1.md`
3. Tabela atual: `kb_ingestion_logs` (conforme `list_tables`)
