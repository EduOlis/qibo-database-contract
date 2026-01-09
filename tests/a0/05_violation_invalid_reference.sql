-- ❌ VIOLAÇÃO: chunk_id inválido (referência órfã)
-- Contrato A0 § 8: "Todo kb_evidence_excerpts.chunk_id deve existir"

-- ❌ TENTATIVA DE VIOLAÇÃO: inserir excerpt sem chunk correspondente
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
  '99999999-9999-9999-9999-999999999999'::uuid,  -- ❌ chunk_id inexistente
  'Texto qualquer',
  'symptom',
  0.75,
  'Justificativa',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- RESULTADO ESPERADO:
-- Se FK constraint existe → ERRO (correto)
-- Se insere com sucesso → VIOLAÇÃO DE INTEGRIDADE
