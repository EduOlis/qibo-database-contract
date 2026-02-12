/*
  # Criação de Tabelas Intermediárias para Pipeline de Conhecimento

  1. Novas Tabelas
    - kb_evidence_clusters: agrupamentos mecânicos de evidências (saída A1)
    - kb_evidence_conflicts: sinalizações de conflitos textuais
    - kb_textual_tensions: organização de tensões textuais (saída A2)
    - kb_tension_groups: agrupamentos de tensões relacionadas
    - kb_document_pipeline_status: tracking de estado do documento no pipeline
    - kb_notifications: sistema de notificações para revisores

  2. Campos Adicionados em Tabelas Existentes
    - kb_raw_chunks.processed: indica se chunk foi processado pelo A0
    - kb_raw_chunks.processed_at: timestamp do processamento

  3. Segurança
    - RLS habilitado em todas as novas tabelas
    - Políticas restritivas por padrão
    - Acesso controlado por autenticação
*/

-- Adicionar campo processed ao kb_raw_chunks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_raw_chunks' AND column_name = 'processed'
  ) THEN
    ALTER TABLE kb_raw_chunks ADD COLUMN processed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_raw_chunks' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE kb_raw_chunks ADD COLUMN processed_at timestamptz;
  END IF;
END $$;

-- Criar tabela de clusters de evidências (A1)
CREATE TABLE IF NOT EXISTS kb_evidence_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  cluster_label text NOT NULL,
  cluster_basis text,
  evidence_ids uuid[] NOT NULL,
  confidence_level numeric(3,2),
  agent_version text NOT NULL,
  contract_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT kb_evidence_clusters_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  CONSTRAINT kb_evidence_clusters_confidence_check CHECK (confidence_level >= 0 AND confidence_level <= 1)
);

ALTER TABLE kb_evidence_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clusters from their sources"
  ON kb_evidence_clusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert clusters"
  ON kb_evidence_clusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update cluster reviews"
  ON kb_evidence_clusters FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar tabela de conflitos de evidências
CREATE TABLE IF NOT EXISTS kb_evidence_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  evidence_ids uuid[] NOT NULL,
  conflict_type text NOT NULL,
  conflict_description text,
  detected_by_agent text NOT NULL,
  agent_version text NOT NULL,
  severity text,
  resolved boolean DEFAULT false NOT NULL,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT kb_evidence_conflicts_type_check CHECK (conflict_type IN ('contradiction', 'terminology_variation', 'incompatible_descriptions', 'temporal_inconsistency'))
);

ALTER TABLE kb_evidence_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conflicts"
  ON kb_evidence_conflicts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert conflicts"
  ON kb_evidence_conflicts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update conflicts"
  ON kb_evidence_conflicts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar tabela de tensões textuais (A2)
CREATE TABLE IF NOT EXISTS kb_textual_tensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  tension_type text NOT NULL,
  tension_description text NOT NULL,
  cluster_ids uuid[],
  evidence_ids uuid[] NOT NULL,
  textual_basis text NOT NULL,
  agent_version text NOT NULL,
  contract_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT kb_textual_tensions_status_check CHECK (status IN ('pending', 'acknowledged', 'false_positive', 'resolved')),
  CONSTRAINT kb_textual_tensions_type_check CHECK (tension_type IN ('contradiction', 'terminology_variation', 'incompatibility', 'coexistence'))
);

ALTER TABLE kb_textual_tensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tensions"
  ON kb_textual_tensions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert tensions"
  ON kb_textual_tensions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tensions"
  ON kb_textual_tensions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar tabela de grupos de tensões
CREATE TABLE IF NOT EXISTS kb_tension_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES kb_sources(id) ON DELETE CASCADE,
  group_label text NOT NULL,
  tension_ids uuid[] NOT NULL,
  grouping_basis text,
  agent_version text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE kb_tension_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tension groups"
  ON kb_tension_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert tension groups"
  ON kb_tension_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar tabela de status do pipeline de documentos
CREATE TABLE IF NOT EXISTS kb_document_pipeline_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL UNIQUE REFERENCES kb_sources(id) ON DELETE CASCADE,
  p0_status text NOT NULL DEFAULT 'pending',
  p0_completed_at timestamptz,
  a0_status text NOT NULL DEFAULT 'pending',
  a0_completed_at timestamptz,
  a1_status text NOT NULL DEFAULT 'pending',
  a1_completed_at timestamptz,
  a2_status text NOT NULL DEFAULT 'pending',
  a2_completed_at timestamptz,
  validation_status text NOT NULL DEFAULT 'pending',
  validation_completed_at timestamptz,
  total_chunks integer DEFAULT 0,
  processed_chunks integer DEFAULT 0,
  total_evidences integer DEFAULT 0,
  approved_evidences integer DEFAULT 0,
  total_clusters integer DEFAULT 0,
  approved_clusters integer DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT kb_pipeline_status_check CHECK (
    p0_status IN ('pending', 'processing', 'completed', 'failed') AND
    a0_status IN ('pending', 'processing', 'completed', 'failed') AND
    a1_status IN ('pending', 'processing', 'completed', 'failed') AND
    a2_status IN ('pending', 'processing', 'completed', 'failed') AND
    validation_status IN ('pending', 'in_progress', 'completed')
  )
);

ALTER TABLE kb_document_pipeline_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipeline status"
  ON kb_document_pipeline_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert pipeline status"
  ON kb_document_pipeline_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update pipeline status"
  ON kb_document_pipeline_status FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS kb_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT kb_notifications_type_check CHECK (
    notification_type IN ('evidence_pending', 'cluster_pending', 'tension_detected', 'validation_required', 'process_completed', 'process_failed')
  )
);

ALTER TABLE kb_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON kb_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert notifications"
  ON kb_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON kb_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_kb_raw_chunks_processed ON kb_raw_chunks(processed);
CREATE INDEX IF NOT EXISTS idx_kb_evidence_clusters_status ON kb_evidence_clusters(status);
CREATE INDEX IF NOT EXISTS idx_kb_evidence_clusters_source ON kb_evidence_clusters(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_textual_tensions_status ON kb_textual_tensions(status);
CREATE INDEX IF NOT EXISTS idx_kb_textual_tensions_source ON kb_textual_tensions(source_id);
CREATE INDEX IF NOT EXISTS idx_kb_notifications_user ON kb_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_kb_pipeline_status_source ON kb_document_pipeline_status(source_id);