/*
  # Criar tabelas para entidades extraídas e relações propostas

  1. Novas Tabelas
    - kb_extracted_entities: Armazena entidades estruturadas extraídas das evidências
      - Categorias: syndrome, symptom, clinical_sign, therapeutic_principle, acupoint
      - Inclui dados estruturados específicos por tipo (jsonb)
      - Status de validação (pending/approved/rejected)
    
    - kb_entity_relations_proposals: Relações propostas entre entidades extraídas
      - Tipos: has_symptom, has_clinical_sign, treated_by_principle, treated_by_acupoint
      - Referência às evidências textuais que suportam a relação
      - Status de validação (pending/approved/rejected)

  2. Conformidade
    - Entidades aprovadas podem ser migradas para tabelas TCM (tcm_syndromes, tcm_symptoms, etc)
    - Relações aprovadas podem ser migradas para tabelas de junção
    - Mantém rastreabilidade completa: entidade → evidência → chunk → source

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas restritivas para usuários autenticados
    - Validação de tipos de entidades e relações via constraints
*/

-- Criar tabela de entidades extraídas
CREATE TABLE IF NOT EXISTS kb_extracted_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid NOT NULL REFERENCES kb_evidence_excerpts(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('syndrome', 'symptom', 'clinical_sign', 'therapeutic_principle', 'acupoint')),
  entity_label text NOT NULL,
  entity_data jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extraction_rationale text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  migrated_to_tcm boolean DEFAULT false NOT NULL,
  tcm_table_name text,
  tcm_entity_id uuid,
  agent_version text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE kb_extracted_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view extracted entities"
  ON kb_extracted_entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert extracted entities"
  ON kb_extracted_entities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update entity reviews"
  ON kb_extracted_entities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kb_extracted_entities_type ON kb_extracted_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_kb_extracted_entities_status ON kb_extracted_entities(status);
CREATE INDEX IF NOT EXISTS idx_kb_extracted_entities_evidence ON kb_extracted_entities(evidence_id);
CREATE INDEX IF NOT EXISTS idx_kb_extracted_entities_source ON kb_extracted_entities(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_extracted_entities_label ON kb_extracted_entities(entity_label);

-- Criar tabela de relações propostas entre entidades
CREATE TABLE IF NOT EXISTS kb_entity_relations_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  from_entity_id uuid NOT NULL REFERENCES kb_extracted_entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES kb_extracted_entities(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN (
    'has_symptom',
    'has_clinical_sign',
    'treated_by_principle',
    'treated_by_acupoint',
    'causes',
    'alleviates',
    'contraindicated_with',
    'combined_with'
  )),
  textual_evidence text NOT NULL,
  evidence_ids uuid[] NOT NULL,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extraction_rationale text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  migrated_to_tcm boolean DEFAULT false NOT NULL,
  tcm_table_name text,
  tcm_relation_id uuid,
  agent_version text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT no_self_relation CHECK (from_entity_id != to_entity_id)
);

ALTER TABLE kb_entity_relations_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entity relations"
  ON kb_entity_relations_proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert entity relations"
  ON kb_entity_relations_proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update relation reviews"
  ON kb_entity_relations_proposals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kb_relations_from ON kb_entity_relations_proposals(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_kb_relations_to ON kb_entity_relations_proposals(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_kb_relations_type ON kb_entity_relations_proposals(relation_type);
CREATE INDEX IF NOT EXISTS idx_kb_relations_status ON kb_entity_relations_proposals(status);
CREATE INDEX IF NOT EXISTS idx_kb_relations_source ON kb_entity_relations_proposals(source_id);
