-- ❌ VIOLAÇÃO: A0 tentando validar cientificamente o conteúdo
-- Contrato A0 § 10: "Validar cientificamente qualquer trecho" NÃO é responsabilidade do A0

-- Setup: texto com informação potencialmente incorreta
INSERT INTO kb_raw_chunks (id, source_id, raw_text, language, processed)
VALUES (
  'test-chunk-010'::uuid,
  'test-source-001'::uuid,
  'A Deficiência de Yang do Coração causa febre alta persistente.',
  'pt-BR',
  false
);

-- ❌ TENTATIVA DE VIOLAÇÃO: A0 filtrando por "correção científica"
-- CENÁRIO 1: A0 rejeita o trecho por considerar incorreto
-- (não inserindo nada em kb_evidence_excerpts)

-- ❌ CENÁRIO 2: A0 insere mas marca como "cientificamente duvidoso"
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
  'test-chunk-010'::uuid,
  'A Deficiência de Yang do Coração causa febre alta persistente.',
  'syndrome',
  0.30,  -- ❌ score baixo por "validação científica"
  'Trecho clinicamente questionável - não corresponde ao padrão clássico.',  -- ❌ julgamento clínico
  'pt-BR',
  'pending',
  'A0-evidence-extractor'
);

-- VIOLAÇÃO: A0 está fazendo julgamento de validade clínica
-- Responsabilidade: A0 apenas identifica padrões textuais
-- Validação científica: responsabilidade humana
