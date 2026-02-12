/*
  # Criar bucket de storage para documentos

  1. Novo Bucket
    - `documents`: armazena PDFs e arquivos de texto temporariamente
    - Público para leitura
    - Requer autenticação para upload

  2. Segurança
    - RLS habilitado
    - Políticas restritivas de upload e acesso
    - Usuários autenticados podem fazer upload
    - Arquivos são acessíveis apenas pelo uploader
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'text/plain', 'application/x-mobipocket-ebook', 'application/vnd.amazon.ebook']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);