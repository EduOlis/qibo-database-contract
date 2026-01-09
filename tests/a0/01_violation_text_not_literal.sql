-- ❌ VIOLAÇÃO: raw_text não é substring literal do chunk original
-- Contrato A0 § 5.1: "raw_text DEVE ser um substring literal"
-- Se este SQL executar com sucesso, o contrato foi violado

-- Setup: criar chunk original
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-001'::uuid,
  'test-source-001'::uuid,
  'A síndrome de Deficiência de Yin do Rim manifesta-se com sudorese noturna.',
  'pt-BR',
  false
);

-- ❌ TENTATIVA DE VIOLAÇÃO: inserir excerpt com texto RESUMIDO (não literal)
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
  'test-chunk-001'::uuid,
  'Deficiência de Yin: sudorese noturna',  -- ❌ RESUMO, não literal
  'syndrome',
  0.85,
  'Trecho relevante sobre síndrome',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- RESULTADO ESPERADO:
-- Se constraint adequada existe → ERRO (correto)
-- Se insere com sucesso → VIOLAÇÃO DETECTADA
