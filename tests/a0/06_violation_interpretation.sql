-- ❌ VIOLAÇÃO: raw_text contendo interpretação/análise ao invés de evidência literal
-- Contrato A0 § 5.2: "A0 NÃO PODE criar definições clínicas"
-- Contrato A0 § 12: Se produzir texto como "Este texto descreve..." → Contrato violado

-- Setup
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-006'::uuid,
  'test-source-001'::uuid,
  'Estase de Qi do Fígado: distensão no hipocôndrio, irritabilidade. Estase de Sangue: dor fixa, língua púrpura.',
  'pt-BR',
  false
);

-- ❌ TENTATIVA DE VIOLAÇÃO: raw_text é descrição/interpretação
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
  'test-chunk-006'::uuid,
  'Este texto descreve duas síndromes com seus respectivos sinais clínicos.',  -- ❌ INTERPRETAÇÃO
  'mixed',
  0.80,
  'Conteúdo relevante sobre síndromes',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- VIOLAÇÃO GRAVE: raw_text é análise, não evidência literal
-- Contrato § 12: "Isso é resumo, não evidência"
