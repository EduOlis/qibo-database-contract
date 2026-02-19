/*
  # Adicionar campos de relevância e controle de processamento aos chunks

  1. Novos Campos
    - kb_raw_chunks.relevance_score: score numérico de 0 a 1 indicando relevância do chunk para extração de evidências
    - kb_raw_chunks.skip_processing: flag booleana permitindo usuário marcar chunks irrelevantes para pular processamento A0
    - kb_raw_chunks.relevance_calculated_at: timestamp do cálculo de relevância

  2. Funcionalidade
    - relevance_score calculado automaticamente após chunking baseado em palavras-chave do domínio TCM
    - skip_processing permite usuário excluir manualmente chunks não relevantes do pipeline
    - Chunks com skip_processing=true não serão processados pelo A0

  3. Segurança
    - Mantém imutabilidade dos campos existentes
    - Permite update apenas de processed, processed_at, relevance_score, skip_processing
*/

-- Adicionar campo relevance_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_raw_chunks' AND column_name = 'relevance_score'
  ) THEN
    ALTER TABLE kb_raw_chunks ADD COLUMN relevance_score numeric(3,2) DEFAULT 0.50;
  END IF;
END $$;

-- Adicionar constraint para relevance_score
ALTER TABLE kb_raw_chunks DROP CONSTRAINT IF EXISTS kb_raw_chunks_relevance_score_check;
ALTER TABLE kb_raw_chunks ADD CONSTRAINT kb_raw_chunks_relevance_score_check 
  CHECK (relevance_score >= 0 AND relevance_score <= 1);

-- Adicionar campo skip_processing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_raw_chunks' AND column_name = 'skip_processing'
  ) THEN
    ALTER TABLE kb_raw_chunks ADD COLUMN skip_processing boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Adicionar timestamp de cálculo de relevância
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_raw_chunks' AND column_name = 'relevance_calculated_at'
  ) THEN
    ALTER TABLE kb_raw_chunks ADD COLUMN relevance_calculated_at timestamptz;
  END IF;
END $$;

-- Atualizar trigger de imutabilidade para permitir update desses novos campos
CREATE OR REPLACE FUNCTION prevent_kb_raw_chunks_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sempre bloquear DELETE
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'kb_raw_chunks is immutable: DELETE operations are not allowed';
  END IF;

  -- Para UPDATE, permitir apenas mudanças em campos específicos
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se algum campo imutável foi modificado
    IF (OLD.id IS DISTINCT FROM NEW.id) OR
       (OLD.source_id IS DISTINCT FROM NEW.source_id) OR
       (OLD.raw_text IS DISTINCT FROM NEW.raw_text) OR
       (OLD.language IS DISTINCT FROM NEW.language) OR
       (OLD.page_reference IS DISTINCT FROM NEW.page_reference) OR
       (OLD.sequence_number IS DISTINCT FROM NEW.sequence_number) OR
       (OLD.created_at IS DISTINCT FROM NEW.created_at) OR
       (OLD.raw_text_hash IS DISTINCT FROM NEW.raw_text_hash) OR
       (OLD.p0_version IS DISTINCT FROM NEW.p0_version) OR
       (OLD.execution_profile IS DISTINCT FROM NEW.execution_profile) THEN
      RAISE EXCEPTION 'kb_raw_chunks is immutable: only processed, processed_at, relevance_score, skip_processing, and relevance_calculated_at fields can be updated';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar índice para queries filtradas por relevance_score
CREATE INDEX IF NOT EXISTS idx_kb_raw_chunks_relevance ON kb_raw_chunks(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_kb_raw_chunks_skip ON kb_raw_chunks(skip_processing) WHERE skip_processing = false;
