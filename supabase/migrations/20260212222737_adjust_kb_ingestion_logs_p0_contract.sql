/*
  # Ajuste de conformidade: kb_ingestion_logs conforme contrato P0

  1. Campos Adicionados
    - execution_profile: identifica o perfil P0 usado (p0-pdf-text-v1, p0-kindle-text-v1, etc.)
    - operation_type: tipo de operação realizada (ingestion_chunking)
    - status: resultado da execução (success/failed/skipped)
    - execution_time_ms: tempo de execução em milissegundos para métricas de performance

  2. Conformidade
    - Atende completamente a seção 10 do contrato P0 v1.2.0
    - Habilita rastreamento determinístico de todas as execuções
    - Suporta auditoria técnica sem necessidade de inspeção de código
    - Permite reprodutibilidade completa de processamentos

  3. Segurança
    - Mantém RLS existente na tabela
    - Adiciona constraints para garantir valores válidos
*/

-- Adicionar campo execution_profile (perfil de execução P0)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_ingestion_logs' AND column_name = 'execution_profile'
  ) THEN
    ALTER TABLE kb_ingestion_logs ADD COLUMN execution_profile text;
  END IF;
END $$;

-- Adicionar campo operation_type (tipo de operação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_ingestion_logs' AND column_name = 'operation_type'
  ) THEN
    ALTER TABLE kb_ingestion_logs ADD COLUMN operation_type text;
  END IF;
END $$;

-- Adicionar campo status (resultado da execução)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_ingestion_logs' AND column_name = 'status'
  ) THEN
    ALTER TABLE kb_ingestion_logs ADD COLUMN status text;
  END IF;
END $$;

-- Adicionar campo execution_time_ms (tempo de execução)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_ingestion_logs' AND column_name = 'execution_time_ms'
  ) THEN
    ALTER TABLE kb_ingestion_logs ADD COLUMN execution_time_ms integer;
  END IF;
END $$;

-- Adicionar check constraint para status
ALTER TABLE kb_ingestion_logs
DROP CONSTRAINT IF EXISTS kb_ingestion_logs_status_check;

ALTER TABLE kb_ingestion_logs
ADD CONSTRAINT kb_ingestion_logs_status_check
CHECK (status IN ('success', 'failed', 'skipped'));