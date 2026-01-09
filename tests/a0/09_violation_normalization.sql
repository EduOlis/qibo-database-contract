-- ❌ VIOLAÇÃO: A0 tentando normalizar/limpar texto
-- Contrato A0 § 4: "texto copiado literalmente, sem limpeza semântica"

-- Setup: texto com formatação e caracteres especiais
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-009'::uuid,
  'test-source-001'::uuid,
  'Pulso    RÁPIDO    e   superficial   →   Calor externo.',
  'pt-BR',
  false
);

-- ❌ TENTATIVA DE VIOLAÇÃO: normalizar espaçamento e símbolos
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
  'test-chunk-009'::uuid,
  'Pulso rápido e superficial indica Calor externo.',  -- ❌ espaços normalizados, → removida, "indica" adicionado
  'clinical_sign',
  0.89,
  'Sinal diagnóstico',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- VIOLAÇÃO: múltiplas alterações de formatação
-- Correto: copiar com espaços e símbolos originais
