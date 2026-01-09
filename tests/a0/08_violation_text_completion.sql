-- ❌ VIOLAÇÃO: raw_text com texto completado/inferido
-- Contrato A0 § 5.1: "Nenhuma palavra pode ser completada ou inferida"

-- Setup: texto com elipse/abreviação
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-008'::uuid,
  'test-source-001'::uuid,
  'IG4 trata cefaleia frontal e...',
  'pt-BR',
  false
);

-- ❌ TENTATIVA DE VIOLAÇÃO: completar o texto
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
  'test-chunk-008'::uuid,
  'IG4 trata cefaleia frontal e dores orofaciais.',  -- ❌ texto completado
  'acupoint',
  0.87,
  'Indicação terapêutica',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- VIOLAÇÃO: A0 inferiu o final da frase
-- O correto seria copiar exatamente: "IG4 trata cefaleia frontal e..."
