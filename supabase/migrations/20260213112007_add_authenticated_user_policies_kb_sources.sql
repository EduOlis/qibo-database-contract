/*
  # Adicionar Políticas de RLS para Usuários Autenticados

  1. Changes
    - Adiciona política para permitir que usuários autenticados:
      - Criem suas próprias fontes (INSERT)
      - Vejam suas próprias fontes (SELECT)
      - Atualizem suas próprias fontes (UPDATE)
    
  2. Security
    - Mantém a política de admin existente
    - Usuários só podem manipular fontes onde created_by = auth.uid()
    - Usuários autenticados podem criar novas fontes
*/

-- Política para usuários autenticados poderem criar fontes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_sources' 
    AND policyname = 'Authenticated users can create sources'
  ) THEN
    CREATE POLICY "Authenticated users can create sources"
      ON kb_sources
      FOR INSERT
      TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

-- Política para usuários autenticados verem suas próprias fontes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_sources' 
    AND policyname = 'Users can view own sources'
  ) THEN
    CREATE POLICY "Users can view own sources"
      ON kb_sources
      FOR SELECT
      TO authenticated
      USING (created_by = auth.uid());
  END IF;
END $$;

-- Política para usuários autenticados atualizarem suas próprias fontes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kb_sources' 
    AND policyname = 'Users can update own sources'
  ) THEN
    CREATE POLICY "Users can update own sources"
      ON kb_sources
      FOR UPDATE
      TO authenticated
      USING (created_by = auth.uid())
      WITH CHECK (created_by = auth.uid());
  END IF;
END $$;
