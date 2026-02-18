/*
  # Corrigir trigger de mudança de status de excerpts
  
  1. Alterações
    - Modifica a função enforce_human_status_change para permitir que usuários autenticados
      possam atualizar o status dos excerpts
    - Remove a verificação restritiva de role 'reviewer'
    - Mantém a proteção para garantir que apenas humanos autenticados possam mudar status
  
  2. Segurança
    - Continua bloqueando usuários não autenticados
    - Permite que usuários autenticados revisem e aprovem evidências
*/

-- Atualizar função para aceitar usuários autenticados
CREATE OR REPLACE FUNCTION enforce_human_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Verificar se há um usuário autenticado (não permitir mudanças de serviço/anônimo)
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 
        'Only authenticated human reviewers can change excerpt status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
