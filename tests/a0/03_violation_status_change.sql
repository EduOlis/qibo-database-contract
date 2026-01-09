-- ❌ VIOLAÇÃO: A0 tentando alterar status após criação
-- Contrato A0 § 6: "A0 nunca altera status após criação"
-- Contrato A0 § 10: "Aprovar ou rejeitar conteúdo" não é responsabilidade do A0

-- Setup
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-003'::uuid,
  'test-source-001'::uuid,
  'Língua vermelha com revestimento amarelo indica Calor.',
  'pt-BR',
  false
);

-- Criação inicial (OK)
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
  'test-excerpt-003'::uuid,
  'test-chunk-003'::uuid,
  'Língua vermelha com revestimento amarelo indica Calor.',
  'clinical_sign',
  0.88,
  'Sinal clínico de diagnóstico',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- ❌ TENTATIVA DE VIOLAÇÃO: A0 tentando aprovar o próprio excerpt
UPDATE kb_evidence_excerpts
SET status = 'approved'  -- ❌ Apenas humano pode fazer isso
WHERE id = 'test-excerpt-003'::uuid
  AND created_by_agent = 'A0-evidence-extractor';

-- VIOLAÇÃO: A0 não pode aprovar/rejeitar conteúdo
