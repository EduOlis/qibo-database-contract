-- ❌ VIOLAÇÃO: A0 tentando criar relações entre entidades
-- Contrato A0 § 5.2: "A0 NÃO PODE inferir relações entre entidades"
-- Contrato A0 § 10: "Criar relações entre sintomas, síndromes e pontos" NÃO é responsabilidade do A0

-- Setup
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-007'::uuid,
  'test-source-001'::uuid,
  'Para Deficiência de Yin do Rim, usar KI3 e SP6.',
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
  'test-excerpt-007'::uuid,
  'test-chunk-007'::uuid,
  'Para Deficiência de Yin do Rim, usar KI3 e SP6.',
  'therapeutic_principle',
  0.95,
  'Relação síndrome-tratamento',
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- ❌ TENTATIVA DE VIOLAÇÃO: A0 criando relação estruturada
-- (assumindo tabela de relações)
INSERT INTO kb_syndrome_acupoint_relations (
  id,
  syndrome_name,
  acupoint_code,
  relation_type,
  evidence_excerpt_id,
  created_by_agent
)
VALUES (
  gen_random_uuid(),
  'Deficiência de Yin do Rim',  -- ❌ A0 inferindo entidade
  'KI3',  -- ❌ A0 inferindo código
  'treatment',  -- ❌ A0 inferindo tipo de relação
  'test-excerpt-007'::uuid,
  'A0-evidence-extractor'  -- ❌ A0 não pode criar relações
);

-- VIOLAÇÃO: A0 está estruturando conhecimento (relações)
