/*
  # Atualizar kb_document_pipeline_status para incluir tracking de entidades

  1. Novos Campos
    - total_entities: contador de entidades extraídas
    - approved_entities: contador de entidades aprovadas
    - entities_extracted_at: timestamp da conclusão da extração de entidades
    - total_relations: contador de relações propostas
    - approved_relations: contador de relações aprovadas
    - relations_extracted_at: timestamp da conclusão da extração de relações

  2. Funcionalidade
    - Permite tracking completo do pipeline end-to-end
    - Facilita cálculo de progresso e métricas de qualidade
    - Suporta dashboard com estatísticas consolidadas

  3. Segurança
    - Mantém RLS e políticas existentes
*/

-- Adicionar campos de entities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_document_pipeline_status' AND column_name = 'total_entities'
  ) THEN
    ALTER TABLE kb_document_pipeline_status ADD COLUMN total_entities integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_document_pipeline_status' AND column_name = 'approved_entities'
  ) THEN
    ALTER TABLE kb_document_pipeline_status ADD COLUMN approved_entities integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_document_pipeline_status' AND column_name = 'entities_extracted_at'
  ) THEN
    ALTER TABLE kb_document_pipeline_status ADD COLUMN entities_extracted_at timestamptz;
  END IF;
END $$;

-- Adicionar campos de relations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_document_pipeline_status' AND column_name = 'total_relations'
  ) THEN
    ALTER TABLE kb_document_pipeline_status ADD COLUMN total_relations integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_document_pipeline_status' AND column_name = 'approved_relations'
  ) THEN
    ALTER TABLE kb_document_pipeline_status ADD COLUMN approved_relations integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_document_pipeline_status' AND column_name = 'relations_extracted_at'
  ) THEN
    ALTER TABLE kb_document_pipeline_status ADD COLUMN relations_extracted_at timestamptz;
  END IF;
END $$;
