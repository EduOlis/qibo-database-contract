/*
  # Ajustar trigger de imutabilidade da kb_raw_chunks

  1. Alterações
    - Modifica o trigger para permitir UPDATE apenas nos campos:
      - processed (boolean)
      - processed_at (timestamp)
    - Continua bloqueando UPDATE de todos os outros campos
    - Continua bloqueando DELETE
  
  2. Segurança
    - Mantém proteção dos dados brutos (raw_text, embeddings, etc)
    - Permite marcação de processamento
*/

-- Remover trigger e função antigos
DROP TRIGGER IF EXISTS trg_kb_raw_chunks_immutable ON kb_raw_chunks;
DROP FUNCTION IF EXISTS prevent_kb_raw_chunks_update_delete();

-- Criar nova função que permite update apenas de campos específicos
CREATE OR REPLACE FUNCTION prevent_kb_raw_chunks_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sempre bloquear DELETE
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'kb_raw_chunks is immutable: DELETE operations are not allowed';
  END IF;

  -- Para UPDATE, permitir apenas mudanças em processed e processed_at
  IF TG_OP = 'UPDATE' THEN
    -- Verificar se algum campo além de processed/processed_at foi modificado
    IF (OLD.id IS DISTINCT FROM NEW.id) OR
       (OLD.source_id IS DISTINCT FROM NEW.source_id) OR
       (OLD.raw_text IS DISTINCT FROM NEW.raw_text) OR
       (OLD.embedding IS DISTINCT FROM NEW.embedding) OR
       (OLD.language IS DISTINCT FROM NEW.language) OR
       (OLD.page_reference IS DISTINCT FROM NEW.page_reference) OR
       (OLD.sequence_number IS DISTINCT FROM NEW.sequence_number) OR
       (OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
      RAISE EXCEPTION 'kb_raw_chunks is immutable: only processed and processed_at fields can be updated';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar trigger com nova função
CREATE TRIGGER trg_kb_raw_chunks_immutable
  BEFORE UPDATE OR DELETE ON kb_raw_chunks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_kb_raw_chunks_modification();
