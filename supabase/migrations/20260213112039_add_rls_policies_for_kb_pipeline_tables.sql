/*
  # Adicionar Políticas de RLS para Tabelas do Pipeline KB

  1. Changes
    - Adiciona políticas para usuários autenticados nas tabelas:
      - kb_raw_chunks
      - kb_entity_proposals
      - kb_evidence_excerpts
      - kb_evidence_clusters
      - kb_textual_tensions
      - kb_document_pipeline_status
      - kb_entity_relations
      - kb_evidence_conflicts
      - kb_tension_groups
      - kb_validation_actions
    
  2. Security
    - Usuários podem manipular dados relacionados às suas próprias fontes
    - Baseado em created_by da fonte ou relacionamento direto
*/

-- kb_raw_chunks: chunks pertencem a sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_raw_chunks' 
    AND policyname = 'Users can manage chunks from own sources'
  ) THEN
    CREATE POLICY "Users can manage chunks from own sources"
      ON kb_raw_chunks
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_raw_chunks.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_raw_chunks.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_entity_proposals: propostas de chunks do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_entity_proposals' 
    AND policyname = 'Users can manage proposals from own chunks'
  ) THEN
    CREATE POLICY "Users can manage proposals from own chunks"
      ON kb_entity_proposals
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_raw_chunks c
          JOIN kb_sources s ON s.id = c.source_id
          WHERE c.id = kb_entity_proposals.chunk_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_raw_chunks c
          JOIN kb_sources s ON s.id = c.source_id
          WHERE c.id = kb_entity_proposals.chunk_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_evidence_excerpts: evidências de chunks do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_evidence_excerpts' 
    AND policyname = 'Users can manage evidence from own sources'
  ) THEN
    CREATE POLICY "Users can manage evidence from own sources"
      ON kb_evidence_excerpts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_evidence_excerpts.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_evidence_excerpts.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_evidence_clusters: clusters de sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_evidence_clusters' 
    AND policyname = 'Users can manage clusters from own sources'
  ) THEN
    CREATE POLICY "Users can manage clusters from own sources"
      ON kb_evidence_clusters
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_evidence_clusters.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_evidence_clusters.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_textual_tensions: tensões de sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_textual_tensions' 
    AND policyname = 'Users can manage tensions from own sources'
  ) THEN
    CREATE POLICY "Users can manage tensions from own sources"
      ON kb_textual_tensions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_textual_tensions.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_textual_tensions.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_document_pipeline_status: status de sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_document_pipeline_status' 
    AND policyname = 'Users can manage pipeline status from own sources'
  ) THEN
    CREATE POLICY "Users can manage pipeline status from own sources"
      ON kb_document_pipeline_status
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_document_pipeline_status.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_document_pipeline_status.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_entity_relations: relações de sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_entity_relations' 
    AND policyname = 'Users can manage relations from own sources'
  ) THEN
    CREATE POLICY "Users can manage relations from own sources"
      ON kb_entity_relations
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_entity_relations.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_entity_relations.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_evidence_conflicts: conflitos de sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_evidence_conflicts' 
    AND policyname = 'Users can manage conflicts from own sources'
  ) THEN
    CREATE POLICY "Users can manage conflicts from own sources"
      ON kb_evidence_conflicts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_evidence_conflicts.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_evidence_conflicts.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_tension_groups: grupos de tensão de sources do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_tension_groups' 
    AND policyname = 'Users can manage tension groups from own sources'
  ) THEN
    CREATE POLICY "Users can manage tension groups from own sources"
      ON kb_tension_groups
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_tension_groups.source_id
          AND s.created_by = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM kb_sources s
          WHERE s.id = kb_tension_groups.source_id
          AND s.created_by = auth.uid()
        )
      );
  END IF;
END $$;

-- kb_validation_actions: ações de validação de propostas do usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_validation_actions' 
    AND policyname = 'Users can manage validation actions'
  ) THEN
    CREATE POLICY "Users can manage validation actions"
      ON kb_validation_actions
      FOR ALL
      TO authenticated
      USING (reviewer_id = auth.uid())
      WITH CHECK (reviewer_id = auth.uid());
  END IF;
END $$;
