-- ❌ VIOLAÇÃO: A0 tentando criar entidades clínicas estruturadas
-- Contrato A0 § 10: "Criar entidades clínicas" NÃO é responsabilidade do A0
-- Contrato A0 § 2: "A0 nunca escreve diretamente em kb_entity_proposals"

-- Setup
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-004'::uuid,
  'test-source-001'::uuid,
  'Palpitações e insônia são sintomas comuns.',
  'pt-BR',
  false
);

-- Criação de excerpt (OK)
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
  'test-excerpt-004'::uuid,
  'test-chunk-004'::uuid,
  'Palpitações e insônia são sintomas comuns.',
  'symptom',
  0.92,
  'Múltiplos sintomas mencionados',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- ❌ TENTATIVA DE VIOLAÇÃO: A0 tentando criar entidade estruturada
-- (assumindo que kb_entity_proposals existe)
INSERT INTO kb_entity_proposals (
  id,
  excerpt_id,
  entity_type,
  normalized_name,
  definition,
  confidence_score,
  status,
  created_by_agent
)
VALUES (
  gen_random_uuid(),
  'test-excerpt-004'::uuid,
  'symptom',
  'palpitações',  -- ❌ A0 não deve criar nomes normalizados
  'Sensação de batimento cardíaco irregular',  -- ❌ A0 não deve criar definições
  0.92,
  'pending',
  'A0-evidence-extractor'  -- ❌ A0 não pode escrever nesta tabela
);

-- VIOLAÇÃO CRÍTICA: A0 está criando conhecimento estruturado
