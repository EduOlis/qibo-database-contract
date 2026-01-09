-- ❌ VIOLAÇÃO: raw_text alterado/modificado do original
-- Contrato A0 § 5.1: "Nenhuma palavra pode ser alterada, resumida, completada ou inferida"

-- Setup
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-002'::uuid,
  'test-source-001'::uuid,
  'O ponto VB20 é indicado para cefaleia.',
  'pt-BR',
  false
);

-- ❌ TENTATIVA DE VIOLAÇÃO: texto com palavras alteradas
INSERT INTO kb_evidence_excerpts (
  id,
  chunk_id,
  raw_text,
  suggested_type,
  relevance_score,
  justification,
  language,
  status,
  created_by_agent
)
VALUES (
  gen_random_uuid(),
  'test-chunk-002'::uuid,
  'O acuponto VB20 é indicado para dor de cabeça.',  -- ❌ "ponto"→"acuponto", "cefaleia"→"dor de cabeça"
  'acupoint',
  0.90,
  'Trecho sobre acuponto',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- VIOLAÇÃO: palavras foram substituídas por sinônimos
